import * as React from "react"
import type { SVGProps } from "react"

export function ParleyIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={80}
      height={80}
      viewBox="0 0 80 80"
      className="bg-primary"
      fill="none"
      {...props}
    >
      <g clipPath="url(#parley)">
        <mask
          id="parley"
          width={80}
          height={80}
          x={0}
          y={0}
          maskUnits="userSpaceOnUse"
          style={{
            maskType: "luminance",
          }}
        >
          <path fill="currentColor" d="M80 0H0v80h80z" />
        </mask>
        <g fill="currentColor" mask="url(#b)">
          {/* Conversation bubbles pattern representing dialogue */}
          <circle cx="20" cy="25" r="8" />
          <circle cx="45" cy="20" r="6" />
          <circle cx="60" cy="35" r="7" />
          <circle cx="25" cy="50" r="9" />
          <circle cx="55" cy="55" r="8" />
          
          {/* Connecting lines representing conversation flow */}
          <path d="M28 25 L39 20" stroke="currentColor" strokeWidth="2" fill="none" />
          <path d="M51 20 L53 35" stroke="currentColor" strokeWidth="2" fill="none" />
          <path d="M34 50 L47 55" stroke="currentColor" strokeWidth="2" fill="none" />
          
          {/* Small dots representing ongoing dialogue */}
          <circle cx="35" cy="15" r="2" />
          <circle cx="15" cy="40" r="2" />
          <circle cx="40" cy="65" r="2" />
          <circle cx="65" cy="15" r="2" />
        </g>
      </g>
      <defs>
        <clipPath id="parley">
          <path fill="currentColor" d="M0 0h80v80H0z" />
        </clipPath>
      </defs>
    </svg>
  )
}