/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html','./src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50:'#f5f3ff',100:'#ede9fe',200:'#ddd6fe',300:'#c4b5fd',400:'#a78bfa',500:'#8b5cf6',
          600:'#7c3aed',700:'#6d28d9',800:'#5b21b6',900:'#4c1d95'
        },
        accent: { 50:'#fdf2f8',100:'#fce7f3',200:'#fbcfe8',300:'#f9a8d4',400:'#f472b6',500:'#ec4899',600:'#db2777' },
      },
      boxShadow: {
        soft: '0 8px 30px rgba(0,0,0,.08)',
        'soft-lg':'0 12px 50px rgba(0,0,0,.12)',
      },
      borderRadius: { '2xl':'1.25rem' },
      keyframes: {
        pop: { '0%':{transform:'scale(.98)',opacity:.5}, '100%':{transform:'scale(1)',opacity:1} },
        fade: { '0%':{opacity:0}, '100%':{opacity:1} },
        slideUp: { '0%':{transform:'translateY(6px)',opacity:0}, '100%':{transform:'translateY(0)',opacity:1} },
      },
      animation: { pop:'pop .2s ease-out', fade:'fade .25s ease-out', slideUp:'slideUp .25s ease-out' },
    }
  },
  plugins: [],
}
