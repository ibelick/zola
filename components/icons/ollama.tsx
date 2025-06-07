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
    <path
      fill="currentColor"
      d="M32 8C18.745 8 8 18.745 8 32s10.745 24 24 24 24-10.745 24-24S45.255 8 32 8zm0 4c11.046 0 20 8.954 20 20s-8.954 20-20 20-20-8.954-20-20 8.954-20 20-20z"
    />
    <circle
      cx="32"
      cy="32"
      r="12"
      fill="currentColor"
    />
    <circle
      cx="32"
      cy="32"
      r="6"
      fill="white"
    />
  </svg>
)
export default Icon 