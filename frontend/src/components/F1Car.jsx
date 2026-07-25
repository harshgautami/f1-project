import React, { useId } from "react";

/* A detailed modern-era (ground-effect regs) F1 car in side profile, facing
   right. Pure SVG — gradients for paint depth, carbon lower body, halo,
   multi-element wings, covered 18" wheels. `spinning` spins the rim details
   (used while the car launches). Gradient ids are namespaced per instance so
   several cars (e.g. motion-blur ghosts) can render at once. */
export default function F1Car({ className = "", spinning = false }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const g = (name) => `f1c-${name}-${uid}`;
  const url = (name) => `url(#${g(name)})`;

  const Wheel = ({ cx }) => (
    <g>
      {/* contact shadow */}
      <ellipse cx={cx} cy={258} rx={54} ry={7} fill={url("contact")} />
      {/* tyre */}
      <circle cx={cx} cy={200} r={62} fill={url("tire")} stroke="#050506" strokeWidth="1" />
      {/* top rim-light on the rubber */}
      <path
        d={`M ${cx - 44} ${200 - 40} A 60 60 0 0 1 ${cx + 47} ${200 - 36}`}
        fill="none"
        stroke="rgba(255,255,255,0.10)"
        strokeWidth="4"
        strokeLinecap="round"
      />
      {/* soft-compound sidewall ring */}
      <circle cx={cx} cy={200} r={47} fill="none" stroke="rgba(225,6,0,0.65)" strokeWidth="2.5" />
      {/* aero wheel cover */}
      <circle cx={cx} cy={200} r={37} fill={url("rim")} stroke="#0a0a0c" strokeWidth="1.5" />
      <g className="f1car-rim-spin">
        {Array.from({ length: 7 }).map((_, i) => {
          const a = (i * 360) / 7 + 12;
          const rad = (a * Math.PI) / 180;
          return (
            <line
              key={i}
              x1={cx + 13 * Math.cos(rad)}
              y1={200 + 13 * Math.sin(rad)}
              x2={cx + 31 * Math.cos(rad)}
              y2={200 + 31 * Math.sin(rad)}
              stroke="#0b0c10"
              strokeWidth="3"
              strokeLinecap="round"
            />
          );
        })}
        <circle cx={cx} cy={200} r={24} fill="none" stroke="#0e0f13" strokeWidth="1.5" />
        <path
          d={`M ${cx - 26} ${200 - 14} A 29 29 0 0 1 ${cx - 2} ${200 - 29}`}
          fill="none"
          stroke="rgba(255,255,255,0.25)"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </g>
      <circle cx={cx} cy={200} r={8} fill="#08080a" stroke="#33363e" strokeWidth="1.5" />
      <circle cx={cx} cy={200} r={3.5} fill="#e10600" />
    </g>
  );

  return (
    <svg
      viewBox="0 0 1000 300"
      className={`f1car ${spinning ? "spinning" : ""} ${className}`}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={g("body")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ff4a3a" />
          <stop offset="0.1" stopColor="#f01808" />
          <stop offset="0.42" stopColor="#cf0a00" />
          <stop offset="0.72" stopColor="#9a0400" />
          <stop offset="1" stopColor="#5d0200" />
        </linearGradient>
        <linearGradient id={g("carbon")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#191b21" />
          <stop offset="1" stopColor="#0a0b0e" />
        </linearGradient>
        <linearGradient id={g("plate")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#23262e" />
          <stop offset="1" stopColor="#0c0d11" />
        </linearGradient>
        <linearGradient id={g("plateRed")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e81205" />
          <stop offset="0.55" stopColor="#a80500" />
          <stop offset="1" stopColor="#520100" />
        </linearGradient>
        <linearGradient id={g("wingtop")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2b2f38" />
          <stop offset="0.5" stopColor="#15171d" />
          <stop offset="1" stopColor="#0a0b0e" />
        </linearGradient>
        <radialGradient id={g("tire")}>
          <stop offset="0" stopColor="#17171b" />
          <stop offset="0.6" stopColor="#131317" />
          <stop offset="0.8" stopColor="#1c1c22" />
          <stop offset="0.92" stopColor="#0f0f13" />
          <stop offset="1" stopColor="#08080b" />
        </radialGradient>
        <radialGradient id={g("rim")} fx="0.35" fy="0.3">
          <stop offset="0" stopColor="#4b515c" />
          <stop offset="0.45" stopColor="#262932" />
          <stop offset="0.8" stopColor="#14161b" />
          <stop offset="1" stopColor="#0d0e12" />
        </radialGradient>
        <radialGradient id={g("shadow")}>
          <stop offset="0" stopColor="rgba(0,0,0,0.55)" />
          <stop offset="0.7" stopColor="rgba(0,0,0,0.28)" />
          <stop offset="1" stopColor="rgba(0,0,0,0)" />
        </radialGradient>
        <radialGradient id={g("contact")}>
          <stop offset="0" stopColor="rgba(0,0,0,0.7)" />
          <stop offset="1" stopColor="rgba(0,0,0,0)" />
        </radialGradient>
        <radialGradient id={g("helmet")} fx="0.35" fy="0.3">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.6" stopColor="#dfe3ea" />
          <stop offset="1" stopColor="#9aa0ac" />
        </radialGradient>
      </defs>

      {/* whole-car ground shadow */}
      <ellipse cx="520" cy="260" rx="430" ry="10" fill={url("shadow")} />

      {/* ===== rear wing (planes emerge inboard of the near-side endplate) ===== */}
      {/* DRS flap */}
      <path d="M 66 52 C 110 47, 152 45, 184 48 L 184 60 C 150 57, 108 60, 66 65 Z" fill={url("wingtop")} />
      <path d="M 66 52 C 110 47, 152 45, 184 48" stroke="rgba(255,255,255,0.22)" strokeWidth="1.4" fill="none" />
      {/* DRS actuator pod */}
      <path d="M 118 43 L 138 43 L 133 53 L 122 53 Z" fill="#181b21" />
      {/* main plane */}
      <path d="M 62 72 C 108 66, 155 64, 190 68 L 190 84 C 152 79, 106 82, 62 89 Z" fill={url("wingtop")} />
      <path d="M 62 72 C 108 66, 155 64, 190 68" stroke="rgba(255,255,255,0.16)" strokeWidth="1.3" fill="none" />
      {/* swan-neck pylon down to the engine cover */}
      <path d="M 182 118 L 154 70 L 165 65 L 190 114 Z" fill="#181b21" />
      {/* beam wing */}
      <path d="M 96 140 L 172 130 L 172 139 L 96 150 Z" fill={url("wingtop")} />
      <path d="M 102 156 L 174 147 L 174 155 L 102 165 Z" fill={url("wingtop")} />
      {/* endplate (near side) — slim blade, red livery face, rolled top */}
      <path
        d="M 44 54 C 54 44, 78 40, 90 46 C 97 50, 100 58, 100 68 L 103 150 C 103 162, 96 170, 84 170 L 60 169 C 50 168, 44 160, 44 150 Z"
        fill={url("plateRed")}
        stroke="#04050a"
        strokeWidth="1"
      />
      {/* carbon trailing-edge strip + specular on the endplate */}
      <path d="M 92 50 C 98 56, 100 62, 100 70 L 103 150 C 103 160, 98 167, 90 169 L 84 170 C 94 166, 96 158, 96 150 L 93 68 C 93 60, 91 54, 87 49 Z" fill="#0d0e12" />
      <path d="M 50 56 C 62 46, 80 44, 88 49" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" fill="none" />
      {/* rain light */}
      <rect x="118" y="150" width="9" height="20" rx="3" fill="#e10600" opacity="0.95" />

      {/* ===== main body ===== */}
      <path
        d="M 132 154
           C 200 128, 300 100, 400 86
           C 418 83, 436 81, 446 82
           L 458 86
           C 455 94, 456 100, 462 106
           L 476 111
           C 500 106, 545 111, 575 120
           C 700 142, 820 162, 935 182
           C 939 185, 939 189, 936 192
           C 870 194, 800 196, 740 199
           C 700 202, 662 205, 636 210
           C 626 213, 616 222, 612 232
           L 610 240
           L 270 240
           C 230 238, 185 230, 152 216
           C 140 196, 133 172, 132 154 Z"
        fill={url("body")}
      />
      {/* carbon floor + sidepod undercut (leaves the pod's flank red) */}
      <path
        d="M 612 232 C 560 208, 480 200, 415 202 C 360 204, 315 212, 288 222 L 284 240 L 610 240 Z"
        fill={url("carbon")}
      />
      <path
        d="M 600 176 C 548 164, 470 162, 415 168 C 360 174, 320 186, 296 198 C 330 190, 380 182, 440 180 C 500 178, 560 182, 598 192 Z"
        fill="rgba(0,0,0,0.35)"
      />
      {/* coke-bottle shading toward the tail */}
      <path
        d="M 290 220 C 240 214, 195 202, 165 188 C 172 202, 190 218, 220 228 C 242 234, 268 238, 290 238 Z"
        fill="rgba(0,0,0,0.3)"
      />
      {/* floor edge accent + edge wing flick */}
      <path d="M 300 236 L 606 236" stroke="rgba(225,6,0,0.45)" strokeWidth="1.5" fill="none" />
      <path d="M 296 230 C 306 224, 320 222, 332 224 L 330 230 Z" fill="#101116" />
      {/* diffuser slats */}
      <path d="M 156 214 C 175 222, 205 230, 240 235" stroke="#04050a" strokeWidth="2" fill="none" />
      <path d="M 150 206 C 170 214, 200 223, 236 229" stroke="rgba(0,0,0,0.5)" strokeWidth="1.5" fill="none" />
      {/* spine + nose speculars */}
      <path d="M 150 148 C 260 112, 340 92, 430 84" stroke="rgba(255,255,255,0.2)" strokeWidth="1.6" fill="none" />
      <path d="M 590 124 C 700 146, 820 166, 928 182" stroke="rgba(255,255,255,0.13)" strokeWidth="1.4" fill="none" />
      {/* nose-to-chassis seam + camera pod */}
      <path d="M 585 128 C 640 138, 690 146, 720 152" stroke="rgba(0,0,0,0.3)" strokeWidth="1.2" fill="none" />
      <rect x="788" y="164" width="16" height="7" rx="2" fill="#0b0c10" />
      {/* engine-cover panel seam */}
      <path d="M 462 96 C 520 110, 560 116, 580 122" stroke="rgba(0,0,0,0.35)" strokeWidth="1.2" fill="none" />
      {/* exhaust */}
      <circle cx="146" cy="146" r="4.5" fill="#060607" stroke="#3c4046" strokeWidth="1.5" />

      {/* airbox intake + T-cam */}
      <ellipse cx="452" cy="90" rx="11" ry="6.5" transform="rotate(-20 452 90)" fill="#050507" stroke="#26262c" strokeWidth="0.8" />
      <rect x="436" y="72" width="16" height="6" rx="2" fill="#0b0c10" />
      <rect x="436" y="72" width="5" height="6" rx="2" fill="#e10600" />

      {/* sidepod inlet */}
      <path d="M 590 140 L 614 143 L 611 168 L 588 163 Z" fill="#060709" />

      {/* cockpit opening + headrest fairing flowing back to the airbox */}
      <path d="M 470 112 C 500 106, 545 112, 575 121 L 574 126 C 545 118, 502 114, 474 118 Z" fill="#08090b" />
      <path d="M 464 106 C 476 100, 490 98, 500 100 L 500 116 C 486 112, 472 112, 464 114 Z" fill="#15161b" />

      {/* driver helmet (sunk into the cockpit) */}
      <circle cx="509" cy="106" r="16" fill={url("helmet")} />
      <path d="M 509 90 A 16 16 0 0 1 522 98 C 514 96, 505 95, 497 96 A 16 16 0 0 1 509 90 Z" fill="#c00500" />
      <path d="M 515 99 L 525 103 A 16 16 0 0 1 525 108 L 513 106 Z" fill="#0a0c12" />
      <path d="M 495 100 C 502 97, 512 96, 520 98" stroke="#c00500" strokeWidth="2" fill="none" />

      {/* halo */}
      <path d="M 470 96 C 496 78, 552 80, 582 112" stroke="#1b1d24" strokeWidth="10" fill="none" strokeLinecap="round" />
      <path d="M 578 110 L 569 125" stroke="#1b1d24" strokeWidth="7" strokeLinecap="round" />
      <path d="M 472 93 C 497 76, 550 78, 579 108" stroke="rgba(255,255,255,0.14)" strokeWidth="2" fill="none" />

      {/* mirror */}
      <rect x="548" y="97" width="15" height="9" rx="2" fill="#0c0d10" />
      <path d="M 550 106 L 542 112" stroke="#0c0d10" strokeWidth="2.5" />

      {/* livery marks */}
      <text
        x="392"
        y="150"
        fontFamily="'Titillium Web', Inter, sans-serif"
        fontWeight="900"
        fontStyle="italic"
        fontSize="22"
        fill="rgba(255,255,255,0.92)"
        transform="skewX(-8)"
      >
        F1M
      </text>
      <text
        x="240"
        y="130"
        fontFamily="'Titillium Web', Inter, sans-serif"
        fontWeight="900"
        fontStyle="italic"
        fontSize="30"
        fill="rgba(255,255,255,0.9)"
        transform="rotate(-16 240 130)"
      >
        1
      </text>

      {/* ===== front wing (elements emerge inboard of the endplate) ===== */}
      <path d="M 800 246 C 856 242, 912 240, 948 240 L 948 248 C 910 250, 854 252, 800 252 Z" fill={url("carbon")} />
      <path d="M 814 234 C 868 230, 916 228, 946 229 L 946 236 C 912 236, 864 238, 814 241 Z" fill={url("carbon")} />
      <path d="M 830 222 C 880 218, 920 216, 944 218 L 944 224 C 916 224, 878 226, 830 229 Z" fill={url("carbon")} />
      <path d="M 846 211 C 890 207, 924 206, 942 208 L 942 214 C 920 213, 888 215, 846 218 Z" fill={url("plate")} />
      <path d="M 846 211 C 890 207, 924 206, 942 208" stroke="rgba(255,255,255,0.15)" strokeWidth="1.2" fill="none" />
      {/* pylons (carbon) */}
      <path d="M 880 196 L 874 246" stroke="#101116" strokeWidth="6" />
      <path d="M 914 192 L 910 242" stroke="#101116" strokeWidth="6" />
      {/* endplate — slim canted blade, red livery face */}
      <path
        d="M 948 200 C 958 193, 966 194, 968 202 L 973 242 C 973 249, 968 252, 960 252 L 951 252 C 947 252, 945 249, 945 244 Z"
        fill={url("plateRed")}
        stroke="#04050a"
        strokeWidth="1"
      />
      <path d="M 967 204 L 971 242" stroke="#0d0e12" strokeWidth="2.5" fill="none" />
      <path d="M 950 202 C 956 196, 962 195, 966 199" stroke="rgba(255,255,255,0.22)" strokeWidth="1.3" fill="none" />

      {/* ===== wheels ===== */}
      <Wheel cx={195} />
      <Wheel cx={745} />

      {/* ===== suspension over the wheels (near-side arms) ===== */}
      <path d="M 648 152 L 740 188" stroke="#15161c" strokeWidth="4.5" strokeLinecap="round" />
      <path d="M 676 145 L 744 186" stroke="#15161c" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M 705 154 L 746 194" stroke="#15161c" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M 662 206 L 740 206" stroke="#15161c" strokeWidth="4" strokeLinecap="round" />
      <path d="M 648 152 L 740 188" stroke="rgba(255,255,255,0.09)" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M 302 176 L 200 192" stroke="#15161c" strokeWidth="4.5" strokeLinecap="round" />
      <path d="M 312 206 L 202 205" stroke="#15161c" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}
