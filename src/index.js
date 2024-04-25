import { createLibp2p } from "libp2p";
import { webSockets } from "@libp2p/websockets";
import { multiaddr } from "@multiformats/multiaddr";
import { noise } from "@chainsafe/libp2p-noise";
import { yamux } from "@chainsafe/libp2p-yamux";
import { identify } from "@libp2p/identify";
import { ping } from "@libp2p/ping";
import { kadDHT, removePrivateAddressesMapper } from "@libp2p/kad-dht";
import { createEd25519PeerId } from "@libp2p/peer-id-factory";

const peerId = await createEd25519PeerId();

const node = await createLibp2p({
  peerId,
  transports: [webSockets()],
  connectionEncryption: [noise()],
  streamMuxers: [yamux()],
  services: {
    ping: ping(),
    identify: identify(),
    dht: kadDHT({
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

await node.dialProtocol(ma, "/centrifuge/kad", {
  signal: AbortSignal.timeout(10_000),
});
