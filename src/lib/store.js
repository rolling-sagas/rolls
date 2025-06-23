import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useStore = create(
  persist(
    () => ({
      messages: [],
      modules: [],
      configs: [],

      model: "GPT-4o Mini",
      playMode: false,
      library: "modules",

      avatar: null, // avatar for player and assistant
      sandbox: null, // quickjs sandbox

      openai_api_key: "",
      azure_api_key: "",
      deepseek_api_key: "",
      anthropic_api_key: "",
    }),
    {
      name: "store",
      partialize: (state) => ({
        messages: state.messages,
        modules: state.modules,
        configs: state.configs,

        model: state.model,
        playMode: state.playMode,
        library: state.library,

        openai_api_key: state.openai_api_key,
        azure_api_key: state.azure_api_key,
        deepseek_api_key: state.deepseek_api_key,
        claude_api_key: state.claude_api_key,
      }),
    },
  ),
);

export function togglePlayMode() {
  useStore.setState((state) => ({ playMode: !state.playMode }));
}
