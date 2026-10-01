import { ImageResponse } from "next/og";

export const alt = "Tessera — Public Goods Intelligence";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const mark =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='96' height='96' viewBox='0 0 64 64'><polygon points='32,9 43,20 32,31 21,20' fill='#e8633a'/><polygon points='44,21 55,32 44,43 33,32' fill='#46d6d0'/><polygon points='32,33 43,44 32,55 21,44' fill='#ece7da'/><polygon points='20,21 31,32 20,43 9,32' fill='#9ba39f'/></svg>`,
  );

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "radial-gradient(900px 600px at 85% 20%, #2a1260, #07060d 70%)",
          padding: 72,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={mark} width={68} height={68} alt="" />
          <div style={{ fontSize: 38, color: "#f1eefc", letterSpacing: -1 }}>Tessera</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ display: "flex", flexWrap: "wrap", fontSize: 82, letterSpacing: -2, lineHeight: 1 }}>
            <span style={{ color: "#f1eefc" }}>Evidence over&nbsp;</span>
            <span style={{ color: "#b98cff" }}>narrative.</span>
          </div>
          <div style={{ display: "flex", fontSize: 27, color: "#a6a1c4", maxWidth: 940 }}>
            An autonomous agent for Ethereum public-goods funding — live trust-graph, mechanism, and on-chain analysis.
          </div>
        </div>

        <div style={{ display: "flex", fontSize: 21, color: "#4cc2e9", fontFamily: "monospace" }}>
          Octant · OSO · GitHub · Optimism RetroPGF · BNB Chain + 10 EVM chains
        </div>
      </div>
    ),
    { ...size },
  );
}
