import * as React from "react"
import { SVGProps, Ref, forwardRef } from "react"
const SvgComponent = (
  props: SVGProps<SVGSVGElement>,
  ref: Ref<SVGSVGElement>
) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={25}
    height={25}
    fill="none"
    ref={ref}
    {...props}
  >
    <path stroke="url(#a)" strokeWidth={0.5} d="m12.477 5.909.005-4.091" />
    <path stroke="#F050F0" strokeWidth={0.5} d="M23.817 12.377 12.777 1.309" />
    <path stroke="url(#b)" strokeWidth={0.5} d="m12.477 23.181.005-4.09" />
    <path
      stroke="#F050F0"
      strokeWidth={0.5}
      d="m17.817 12.17-4.818-5.182M12.808 17.84l5-6"
    />
    <path
      stroke="#5BD1CB"
      strokeWidth={0.5}
      d="m5.837 12.81 7-6M11.667 18.449H7.648M12.096 17.904l-5-5M1.097 12.273l11.069-11.04M12.496 24.296.732 12.449"
    />
    <path stroke="url(#c)" strokeWidth={0.5} d="m12.748 23.817 11.069-11.04" />
    <path
      fill="url(#d)"
      d="M11.542 24.998h1.884v1.884h-1.884z"
      transform="rotate(-89.926 11.542 24.998)"
    />
    <path
      fill="url(#e)"
      d="m23.113 13.456.003-1.884 1.884.002-.002 1.884-1.885-.002Z"
    />
    <path
      fill="url(#f)"
      d="M11.572 1.884h1.884v1.884h-1.884z"
      transform="rotate(-89.926 11.572 1.884)"
    />
    <path
      fill="url(#g)"
      d="M11.557 13.441h1.884v1.884h-1.884z"
      transform="rotate(-89.926 11.557 13.44)"
    />
    <path
      fill="url(#h)"
      d="M2.885 16.445h1.884v1.884H2.885z"
      transform="rotate(-89.926 2.885 16.445)"
    />
    <path
      fill="url(#i)"
      d="M20.22 16.467h1.884v1.884H20.22z"
      transform="rotate(-89.926 20.22 16.467)"
    />
    <path
      fill="url(#j)"
      d="M20.228 10.312h1.884v1.884h-1.884z"
      transform="rotate(-89.926 20.228 10.312)"
    />
    <path
      fill="url(#k)"
      d="M2.893 10.289h1.884v1.884H2.893z"
      transform="rotate(-89.926 2.893 10.29)"
    />
    <path
      fill="url(#l)"
      d="M8.679 4.77h1.884v1.884H8.679z"
      transform="rotate(-89.926 8.679 4.77)"
    />
    <path
      fill="url(#m)"
      d="M14.583 4.777h1.884v1.884h-1.884z"
      transform="rotate(-89.926 14.583 4.777)"
    />
    <path
      fill="url(#n)"
      d="M14.56 22.112h1.884v1.884H14.56z"
      transform="rotate(-89.926 14.56 22.112)"
    />
    <path
      fill="url(#o)"
      d="M8.656 22.105h1.884v1.884H8.656z"
      transform="rotate(-89.926 8.656 22.105)"
    />
    <path
      fill="url(#p)"
      d="M11.549 19.219h1.884v1.884h-1.884z"
      transform="rotate(-89.926 11.55 19.22)"
    />
    <path
      fill="url(#q)"
      d="M11.564 7.663h1.884v1.884h-1.884z"
      transform="rotate(-89.926 11.564 7.663)"
    />
    <path
      fill="url(#r)"
      d="M5.786 7.655H7.67v1.884H5.786z"
      transform="rotate(-89.926 5.786 7.655)"
    />
    <path
      fill="url(#s)"
      d="M17.343 7.67h1.884v1.884h-1.884z"
      transform="rotate(-89.926 17.343 7.67)"
    />
    <path
      fill="url(#t)"
      d="M17.328 19.227h1.884v1.884h-1.884z"
      transform="rotate(-89.926 17.328 19.227)"
    />
    <path
      fill="url(#u)"
      d="M5.771 19.212h1.884v1.884H5.771z"
      transform="rotate(-89.926 5.77 19.212)"
    />
    <path
      fill="url(#v)"
      d="M5.778 13.434h1.884v1.884H5.778z"
      transform="rotate(-89.926 5.778 13.434)"
    />
    <path
      fill="url(#w)"
      d="M17.335 13.448h1.884v1.884h-1.884z"
      transform="rotate(-89.926 17.335 13.448)"
    />
    <path
      fill="url(#x)"
      d="M0 0h1.884v1.884H0z"
      transform="matrix(.00132 -1 1 .00125 0 13.426)"
    />
    <path stroke="#5BD1CB" strokeWidth={0.5} d="m6.75 12 .005-5" />
    <path
      stroke="#F050F0"
      strokeWidth={0.5}
      d="m18.085 17.343.005-3.894M23.114 12.701l-3.894-.005"
    />
    <path stroke="#5BD1CB" strokeWidth={0.5} d="m5.779 12.678-3.894-.004" />
    <path stroke="#F050F0" strokeWidth={0.5} d="m17.343 6.915-3.894-.005" />
    <defs>
      <linearGradient
        id="a"
        x1={-2.27}
        x2={28.73}
        y1={3.845}
        y2={3.883}
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#5BD1CB" />
        <stop offset={1} stopColor="#F050F0" />
      </linearGradient>
      <linearGradient
        id="b"
        x1={-2.27}
        x2={28.73}
        y1={21.118}
        y2={21.156}
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#5BD1CB" />
        <stop offset={1} stopColor="#F050F0" />
      </linearGradient>
      <linearGradient
        id="c"
        x1={13.278}
        x2={24.346}
        y1={24.348}
        y2={13.309}
        gradientUnits="userSpaceOnUse"
      >
        <stop offset={1} stopColor="#F050F0" />
      </linearGradient>
      <linearGradient
        id="d"
        x1={12.484}
        x2={12.484}
        y1={24.998}
        y2={26.882}
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#5BD1CB" />
        <stop offset={1} stopColor="#F050F0" />
      </linearGradient>
      <linearGradient
        id="e"
        x1={23.115}
        x2={24.999}
        y1={12.514}
        y2={12.516}
        gradientUnits="userSpaceOnUse"
      >
        <stop offset={1} stopColor="#F050F0" />
      </linearGradient>
      <linearGradient
        id="f"
        x1={12.514}
        x2={12.514}
        y1={1.884}
        y2={3.768}
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#5BD1CB" />
        <stop offset={1} stopColor="#F050F0" />
      </linearGradient>
      <linearGradient
        id="g"
        x1={12.499}
        x2={12.499}
        y1={13.441}
        y2={15.325}
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#5BD1CB" />
        <stop offset={1} stopColor="#F050F0" />
      </linearGradient>
      <linearGradient
        id="h"
        x1={3.827}
        x2={3.827}
        y1={16.445}
        y2={18.329}
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#5BD1CB" />
      </linearGradient>
      <linearGradient
        id="i"
        x1={21.162}
        x2={21.162}
        y1={16.467}
        y2={18.351}
        gradientUnits="userSpaceOnUse"
      >
        <stop offset={1} stopColor="#F050F0" />
      </linearGradient>
      <linearGradient
        id="j"
        x1={21.17}
        x2={21.17}
        y1={10.312}
        y2={12.196}
        gradientUnits="userSpaceOnUse"
      >
        <stop offset={1} stopColor="#F050F0" />
      </linearGradient>
      <linearGradient
        id="k"
        x1={3.835}
        x2={3.835}
        y1={10.289}
        y2={12.174}
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#5BD1CB" />
      </linearGradient>
      <linearGradient
        id="l"
        x1={9.621}
        x2={9.621}
        y1={4.77}
        y2={6.654}
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#5BD1CB" />
      </linearGradient>
      <linearGradient
        id="m"
        x1={15.525}
        x2={15.525}
        y1={4.777}
        y2={6.662}
        gradientUnits="userSpaceOnUse"
      >
        <stop offset={1} stopColor="#F050F0" />
      </linearGradient>
      <linearGradient
        id="n"
        x1={15.502}
        x2={15.502}
        y1={22.112}
        y2={23.997}
        gradientUnits="userSpaceOnUse"
      >
        <stop offset={1} stopColor="#F050F0" />
      </linearGradient>
      <linearGradient
        id="o"
        x1={9.598}
        x2={9.598}
        y1={22.105}
        y2={23.989}
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#5BD1CB" />
      </linearGradient>
      <linearGradient
        id="p"
        x1={12.491}
        x2={12.491}
        y1={19.219}
        y2={21.104}
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#5BD1CB" />
        <stop offset={1} stopColor="#F050F0" />
      </linearGradient>
      <linearGradient
        id="q"
        x1={12.506}
        x2={12.506}
        y1={7.663}
        y2={9.547}
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#5BD1CB" />
        <stop offset={1} stopColor="#F050F0" />
      </linearGradient>
      <linearGradient
        id="r"
        x1={6.728}
        x2={6.728}
        y1={7.655}
        y2={9.539}
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#5BD1CB" />
      </linearGradient>
      <linearGradient
        id="s"
        x1={18.285}
        x2={18.285}
        y1={7.67}
        y2={9.554}
        gradientUnits="userSpaceOnUse"
      >
        <stop offset={1} stopColor="#F050F0" />
      </linearGradient>
      <linearGradient
        id="t"
        x1={18.27}
        x2={18.27}
        y1={19.227}
        y2={21.111}
        gradientUnits="userSpaceOnUse"
      >
        <stop offset={1} stopColor="#F050F0" />
      </linearGradient>
      <linearGradient
        id="u"
        x1={6.713}
        x2={6.713}
        y1={19.212}
        y2={21.096}
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#5BD1CB" />
      </linearGradient>
      <linearGradient
        id="v"
        x1={6.72}
        x2={6.72}
        y1={13.434}
        y2={15.318}
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#5BD1CB" />
      </linearGradient>
      <linearGradient
        id="w"
        x1={18.277}
        x2={18.277}
        y1={13.448}
        y2={15.333}
        gradientUnits="userSpaceOnUse"
      >
        <stop offset={1} stopColor="#F050F0" />
      </linearGradient>
      <linearGradient
        id="x"
        x1={0.942}
        x2={0.942}
        y1={0}
        y2={1.884}
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#5BD1CB" />
      </linearGradient>
    </defs>
  </svg>
)
const ForwardRef = forwardRef(SvgComponent)
export default ForwardRef
