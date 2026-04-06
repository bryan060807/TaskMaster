import type { Config } from "@react-router/dev/config";

export default {
  // Tells the framework your code is in 'src'
  appDirectory: "src",
  // This is the MUST-HAVE line to fix your error
  ssr: false, 
} satisfies Config;