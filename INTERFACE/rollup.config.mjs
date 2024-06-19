import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';


export default {
  input: './SRC/index.ts',
  output: {
	sourcemap: true,
    file: './BUILD/JS/index.js',
    format: 'iife', // Immediately Invoked Function Expression (for browser)
    name: 'WorkoutData', // Global variable name
  },
  plugins: [
    typescript({
      tsconfig: './tsconfig.json', // Use your tsconfig.json file
      sourceMap: true, // Include source map for easier debugging
    }),
	nodeResolve()
  ],
};