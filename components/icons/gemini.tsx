import * as React from "react"
import type { SVGProps } from "react"

const Icon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={64}
    height={64}
    viewBox="0 0 64 64"
    fill="none"
    {...props}
  >
    <g clipPath="url(#gemini)">
      <path
        fill="url(#b)"
        d="M32 64A38.14 38.14 0 0 0 0 32 38.14 38.14 0 0 0 32 0a38.15 38.15 0 0 0 32 32 38.15 38.15 0 0 0-32 32"
      />
    </g>
    <defs>
      <linearGradient
        id="b"
        x1={0}
        x2={4398.72}
        y1={6400}
        y2={1945.28}
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#1C7DFF" />
        <stop offset={0.52} stopColor="#1C69FF" />
        <stop offset={1} stopColor="#F0DCD6" />
      </linearGradient>
      <clipPath id="gemini">
        <path fill="#fff" d="M0 0h64v64H0z" />
      </clipPath>
    </defs>
  </svg>
)
export default Icon
