"use client";

import { Shader, FilmGrain, Glass, StudioBackground, Swirl } from "shaders/react";

export default function LeashShader() {
  return (
    <div style={{ position: "relative", display: "inline-block", width: 80, height: 28 }}>
      <Shader style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
        <StudioBackground
          ambientIntensity={65}
          backIntensity={25}
          brightness={100}
          center={{ x: 0.5, y: 0.88 }}
          color="#1b1b21"
          fillAngle={53}
          fillIntensity={9}
          fillSoftness={94}
          keyIntensity={11}
          keySoftness={100}
          wallCurvature={19}
        />
        <Glass
          aberration={1}
          blur={20}
          cutout={true}
          fresnel={0.02}
          fresnelSoftness={0.31}
          highlight={0.3}
          refraction={1.57}
          shapeSdfUrl="https://data.shaders.com/storage/v1/object/public/user-uploaded-images/user_33nh0FG48zZa0rIUZuK7vgwPfZe/_anekeNfTTiN_sdf.bin"
          shapeType="svg"
          thickness={1}
        >
          <Swirl
            blend={18}
            colorA="#141412"
            colorB="#ffffff"
            colorSpace="hsl"
            detail={4.2}
            speed={0.5}
          />
        </Glass>
        <FilmGrain strength={0.1} />
      </Shader>
      <span
        style={{
          position: "relative",
          zIndex: 1,
          fontSize: 20,
          fontWeight: 700,
          letterSpacing: "-0.02em",
          lineHeight: 1,
          color: "transparent",
          mixBlendMode: "overlay",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          background: "linear-gradient(105deg, #555 0%, #ccc 40%, #fff 50%, #ccc 60%, #555 100%)",
        }}
      >
        LEASH
      </span>
    </div>
  );
}
