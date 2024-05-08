import { createLibp2p } from "libp2p";
import { webSockets } from "@libp2p/websockets";
import { multiaddr } from "@multiformats/multiaddr";
import { noise } from "@chainsafe/libp2p-noise";
import { yamux } from "@chainsafe/libp2p-yamux";
import { identify } from "@libp2p/identify";
import { ping } from "@libp2p/ping";
import { peerIdFromKeys, peerIdFromString } from "@libp2p/peer-id";
import { kadDHT, removePrivateAddressesMapper } from "@libp2p/kad-dht";

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
  transports: [webSockets()],
  connectionEncryption: [noise()],
  streamMuxers: [yamux()],
  services: {
    ping: ping(),
    identify: identify(),
    dht: kadDHT({
      kBucketSize: 100,
      protocol: "/centrifuge/kad",
      // protocol: "/sub/kad",
      client: false,
      peerInfoMapper: removePrivateAddressesMapper,
    }),
  },
});

await node.start();

const ma = multiaddr(
  "/ip4/34.159.117.205/tcp/30333/ws/p2p/12D3KooWMspZo4aMEXWBH4UXm3gfiVkeu1AE68Y2JDdVzU723QPc"
);

await node.dialProtocol(ma, "/centrifuge/kad");

const cosminPeerId = peerIdFromString(
  "12D3KooWDnScZfemMmJ5efz9ZkYZ7kW6d8Ezi62ADy57N2VFLUtD"
);

const peerInfo = await node.peerRouting.findPeer(cosminPeerId);

console.log(peerInfo);
