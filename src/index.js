import { createLibp2p } from "libp2p";
import { webSockets } from "@libp2p/websockets";
import { multiaddr } from "@multiformats/multiaddr";
import { noise } from "@chainsafe/libp2p-noise";
import { yamux } from "@chainsafe/libp2p-yamux";
import { identify } from "@libp2p/identify";
import { tcp } from "@libp2p/tcp";
import { ping } from "@libp2p/ping";
import * as websocketsFilter from "@libp2p/websockets/filters";
import { peerIdFromKeys, peerIdFromString } from "@libp2p/peer-id";
import { kadDHT, removePrivateAddressesMapper } from "@libp2p/kad-dht";
import protobuf from "protobufjs";
import path from "path";
import { fileURLToPath } from "url";
import * as lp from "it-length-prefixed";
import map from "it-map";
import { pipe } from "it-pipe";
import { fromString as uint8ArrayFromString } from "uint8arrays/from-string";
import { toString as uint8ArrayToString } from "uint8arrays/to-string";

// Cosmin: 12D3KooWDnScZfemMmJ5efz9ZkYZ7kW6d8Ezi62ADy57N2VFLUtD
// JP:     12D3KooWCWV4hXqS28dB7ybxDTAn78MsQmPMfTGi6aTGqffMhfFs

const privateKeyHex =
  "08011240eeea72dfbb24f56a520e938e5998fea348d30d68917697d3f38d52472b9d23d427fe673e89ba79f6689320f436aa19e3f8a61db012a865a26d0ddd59154d5c76";
const publicKeyHex =
  "0801122027fe673e89ba79f6689320f436aa19e3f8a61db012a865a26d0ddd59154d5c76";

const privateKey = Uint8Array.from(Buffer.from(privateKeyHex, "hex"));
const publicKey = Uint8Array.from(Buffer.from(publicKeyHex, "hex"));

const peerId = await peerIdFromKeys(publicKey, privateKey);

const node = await createLibp2p({
  peerId,
  transports: [
    webSockets({
      filter: websocketsFilter.all,
    }),
    tcp(),
  ],
  connectionEncryption: [noise()],
  streamMuxers: [yamux()],
  services: {
    ping: ping(),
    identify: identify(),
    dht: kadDHT({
      kBucketSize: 100,
      protocol: "/sup/kad",
      clientMode: true,
      peerInfoMapper: removePrivateAddressesMapper,
    }),
  },
});

await node.start();

const ma = multiaddr(
  "/ip4/34.107.30.188/tcp/30333/ws/p2p/12D3KooWN6kXPjAGhYt21gVApD55EAhN7xLxhYRJSLN4HZdWe9sV"
);

await node.dialProtocol(ma, "/sup/kad");

const cosminPeerId = peerIdFromString(
  "12D3KooWDnScZfemMmJ5efz9ZkYZ7kW6d8Ezi62ADy57N2VFLUtD"
);

const peerInfo = await node.peerRouting.findPeer(cosminPeerId);

const stream = await node.dialProtocol(
  peerInfo.multiaddrs[0],
  "/centrifuge-data-extension/1"
);

const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = path.dirname(__filename); // get the name of the directory

const filePath = path.join(__dirname, "data_protocol.v1.proto");

const root = await protobuf.load(filePath);

const DataProtocolRequest = root.lookupType(
  "api.v1.data_protocol.DataProtocolRequest"
);

const BeepRequest = root.lookupType("api.v1.data_protocol.BeepRequest");

const DataProtocolResponse = root.lookupType(
  "api.v1.data_protocol.DataProtocolResponse"
);

const message = DataProtocolRequest.create({
  beepRequest: BeepRequest,
});

const buffer = DataProtocolRequest.encode(message).finish();

// write
pipe(
  buffer,
  (source) => map(source, () => source),
  (source) => lp.encode(source),
  stream.sink
);

// read
pipe(
  stream.source,
  (source) => lp.decode(source),
  (source) => map(source, (buf) => DataProtocolResponse.decode(buf.subarray())),
  async (source) => {
    for await (const msg of source) {
      console.log({ msg });
    }
  }
);
