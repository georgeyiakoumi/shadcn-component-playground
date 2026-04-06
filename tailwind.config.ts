import type { Config } from 'tailwindcss'

// Spacing scale values used by the visual editor — these are generated at runtime
// via .map() in lib/tailwind-options.ts, so Tailwind's content scanner can't find
// them as literal strings. Safelist the full set so all w/h/p/m/gap/inset classes
// past the default scanner range are compiled.
const SPACING_NUMBERS = [
  '0', 'px', '0.5', '1', '1.5', '2', '2.5', '3', '3.5', '4', '5', '6', '7', '8', '9',
  '10', '11', '12', '14', '16', '20', '24', '28', '32', '36', '40', '44', '48',
  '52', '56', '60', '64', '72', '80', '96',
]
const FRACTIONS = [
  '1/2',
  '1/3', '2/3',
  '1/4', '2/4', '3/4',
  '1/5', '2/5', '3/5', '4/5',
  '1/6', '2/6', '3/6', '4/6', '5/6',
  '1/12', '2/12', '3/12', '4/12', '5/12', '6/12', '7/12', '8/12', '9/12', '10/12', '11/12',
]
const SPACING_PATTERNS = [
  // Padding
  ...SPACING_NUMBERS.map((n) => `p-${n}`),
  ...SPACING_NUMBERS.map((n) => `pt-${n}`),
  ...SPACING_NUMBERS.map((n) => `pr-${n}`),
  ...SPACING_NUMBERS.map((n) => `pb-${n}`),
  ...SPACING_NUMBERS.map((n) => `pl-${n}`),
  ...SPACING_NUMBERS.map((n) => `px-${n}`),
  ...SPACING_NUMBERS.map((n) => `py-${n}`),
  // Margin (positive)
  ...SPACING_NUMBERS.map((n) => `m-${n}`),
  ...SPACING_NUMBERS.map((n) => `mt-${n}`),
  ...SPACING_NUMBERS.map((n) => `mr-${n}`),
  ...SPACING_NUMBERS.map((n) => `mb-${n}`),
  ...SPACING_NUMBERS.map((n) => `ml-${n}`),
  ...SPACING_NUMBERS.map((n) => `mx-${n}`),
  ...SPACING_NUMBERS.map((n) => `my-${n}`),
  'm-auto', 'mt-auto', 'mr-auto', 'mb-auto', 'ml-auto', 'mx-auto', 'my-auto',
  // Margin (negative — 0 and px excluded)
  ...SPACING_NUMBERS.filter((n) => n !== '0' && n !== 'px').flatMap((n) => [
    `-m-${n}`, `-mt-${n}`, `-mr-${n}`, `-mb-${n}`, `-ml-${n}`, `-mx-${n}`, `-my-${n}`,
  ]),
  // Width / Height / Size
  ...SPACING_NUMBERS.map((n) => `w-${n}`),
  ...SPACING_NUMBERS.map((n) => `h-${n}`),
  ...SPACING_NUMBERS.map((n) => `size-${n}`),
  ...FRACTIONS.map((f) => `w-${f}`),
  ...FRACTIONS.map((f) => `h-${f}`),
  ...FRACTIONS.map((f) => `size-${f}`),
  // Gap
  ...SPACING_NUMBERS.map((n) => `gap-${n}`),
  ...SPACING_NUMBERS.map((n) => `gap-x-${n}`),
  ...SPACING_NUMBERS.map((n) => `gap-y-${n}`),
  // Space between
  ...SPACING_NUMBERS.map((n) => `space-x-${n}`),
  ...SPACING_NUMBERS.map((n) => `space-y-${n}`),
  // Inset
  ...SPACING_NUMBERS.map((n) => `inset-${n}`),
  ...SPACING_NUMBERS.map((n) => `inset-x-${n}`),
  ...SPACING_NUMBERS.map((n) => `inset-y-${n}`),
  ...SPACING_NUMBERS.map((n) => `top-${n}`),
  ...SPACING_NUMBERS.map((n) => `right-${n}`),
  ...SPACING_NUMBERS.map((n) => `bottom-${n}`),
  ...SPACING_NUMBERS.map((n) => `left-${n}`),
  // Min/max width + height numeric scale
  ...SPACING_NUMBERS.map((n) => `min-w-${n}`),
  ...SPACING_NUMBERS.map((n) => `max-w-${n}`),
  ...SPACING_NUMBERS.map((n) => `min-h-${n}`),
  ...SPACING_NUMBERS.map((n) => `max-h-${n}`),
  // Text indent
  ...SPACING_NUMBERS.map((n) => `indent-${n}`),
]

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  // NOTE: The v3 `safelist` key is no longer supported in Tailwind v4's
  // JS config. The safelist for visual-editor-generated dynamic classes
  // (the SPACING_NUMBERS / FRACTIONS / SPACING_PATTERNS arrays at the
  // top of this file) lives in `app/globals.css` as @source inline()
  // directives instead. The arrays are kept in this file as a reference
  // for what the safelist needs to cover, since the visual editor still
  // imports from lib/tailwind-options.ts which uses the same scale.
  theme: {
  	container: {
  		center: true,
  		padding: '2rem',
  		screens: {
  			'2xl': '1400px'
  		}
  	},
  	extend: {
  		fontFamily: {
  			sans: [
  				'var(--font-sans)',
  				'system-ui',
  				'sans-serif'
  			],
  			mono: [
  				'var(--font-mono)',
  				'monospace'
  			]
  		},
  		colors: {
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		}
  	}
  },
  // Plugins are loaded in app/globals.css via Tailwind v4's @plugin directive.
  // In v4, JS-side plugin registration is replaced by CSS-side @plugin "<name>";
  // tw-animate-css (the v4-compatible successor to tailwindcss-animate) is
  // imported from globals.css instead.
  plugins: [],
}

export default config
