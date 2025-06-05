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
    <g clipPath="url(#mistral)">
      <path
        fill="gold"
        d="M9.141 9.067h9.144v9.141H9.141zm36.571 0h9.147v9.141h-9.147z"
      />
      <path
        fill="#FFAF00"
        d="M9.141 18.208h18.286v9.144H9.144zm27.43 0h18.285v9.144H36.571z"
      />
      <path fill="#FF8205" d="M9.141 27.355H54.86v9.141H9.14z" />
      <path
        fill="#FA500F"
        d="M9.141 36.496h9.144v9.141H9.141zm18.288 0h9.144v9.141H27.43zm18.283 0h9.147v9.141h-9.147z"
      />
      <path
        fill="#E10500"
        d="M0 45.637h27.43v9.144H0zm36.57 0H64v9.144H36.57z"
      />
    </g>
    <defs>
      <clipPath id="mistral">
        <path fill="#fff" d="M0 0h64v64H0z" />
      </clipPath>
    </defs>
  </svg>
)
export default Icon
