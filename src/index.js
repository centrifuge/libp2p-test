import { kadDHT } from "@libp2p/kad-dht";
import { createLibp2p } from "libp2p";
import { peerIdFromString } from "@libp2p/peer-id";

const node = await createLibp2p({
  services: {
    dht: kadDHT({
      protocol:
        "ip4/34.159.117.205/tcp/30333/ws/p2p/12D3KooWMspZo4aMEXWBH4UXm3gfiVkeu1AE68Y2JDdVzU723QPc",
      client: true,
    }),
  },
});

const peerId = peerIdFromString(
  "12D3KooWMspZo4aMEXWBH4UXm3gfiVkeu1AE68Y2JDdVzU723QPc"
);
const peerInfo = await node.peerRouting.findPeer(peerId);

console.info(peerInfo); // peer id, multiaddrs
