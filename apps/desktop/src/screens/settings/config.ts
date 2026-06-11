import type { SettingCategory } from "./types";

export const settingsConfig: SettingCategory[] = [
  {
    id: "general",
    title: "General",
    items: [
      {
        id: "when_closing_no_tabs",
        title: "When Closing With No Tabs",
        description:
          "What to do when using the 'close active item' action with no tabs.",
        type: "select",
        options: [
          { label: "Platform Default", value: "platform_default" },
          { label: "Keep Window Open", value: "keep_open" },
          { label: "Close Window", value: "close_window" },
        ],
        defaultValue: "platform_default",
      },
      {
        id: "on_last_window_closed",
        title: "On Last Window Closed",
        description: "What to do when the last window is closed.",
        type: "select",
        options: [
          { label: "Platform Default", value: "platform_default" },
          { label: "Quit App", value: "quit_app" },
          { label: "Keep App Running", value: "keep_running" },
        ],
        defaultValue: "platform_default",
      },
      {
        id: "use_system_path_prompts",
        title: "Use System Path Prompts",
        description: "Use native OS dialogs for 'Open' and 'Save As'.",
        type: "switch",
        defaultValue: true,
      },
      {
        id: "use_system_prompts",
        title: "Use System Prompts",
        description: "Use native OS dialogs for confirmations.",
        type: "switch",
        defaultValue: true,
      },
      {
        id: "redact_private_values",
        title: "Redact Private Values",
        description: "Hide the values of variables in private files.",
        type: "switch",
        defaultValue: false,
      },
      {
        id: "private_files",
        title: "Private Files",
        description:
          "Globs to match against file paths to determine if a file is private.",
        type: "button",
        buttonText: "Edit in settings.json",
      },
      {
        id: "cli_default_open_behavior",
        title: "CLI Default Open Behavior",
        description:
          "How zed <path> opens directories when no flag is specified.",
        type: "select",
        options: [
          { label: "Open a New Window", value: "new_window" },
          { label: "Open in Current Window", value: "current_window" },
        ],
        defaultValue: "new_window",
      },
      {
        id: "trust_all_projects_by_default",
        title: "Trust All Projects By Default",
        type: "switch",
        defaultValue: false,
      },
    ],
  },
  {
    id: "appearance",
    title: "Appearance",
    items: [
      {
        id: "theme",
        title: "Theme",
        description: "Select the application theme.",
        type: "select",
        options: [
          { label: "System Default", value: "system" },
          { label: "Dark", value: "dark" },
          { label: "Light", value: "light" },
        ],
        defaultValue: "dark",
      },
      {
        id: "ui_font_size",
        title: "UI Font Size",
        description: "Adjust the size of the user interface text.",
        type: "select",
        options: [
          { label: "Small", value: "small" },
          { label: "Medium", value: "medium" },
          { label: "Large", value: "large" },
        ],
        defaultValue: "medium",
      },
    ],
  },
  {
    id: "keymap",
    title: "Keymap",
    items: [
      {
        id: "keymap_profile",
        title: "Keymap Profile",
        type: "select",
        options: [
          { label: "Default", value: "default" },
          { label: "Vim", value: "vim" },
          { label: "VS Code", value: "vscode" },
        ],
        defaultValue: "default",
      },
    ],
  },
  { id: "editor", title: "Editor", items: [] },
  { id: "languages_tools", title: "Languages & Tools", items: [] },
  { id: "search_files", title: "Search & Files", items: [] },
  { id: "window_layout", title: "Window & Layout", items: [] },
  { id: "panels", title: "Panels", items: [] },
  { id: "debugger", title: "Debugger", items: [] },
  { id: "terminal", title: "Terminal", items: [] },
  { id: "version_control", title: "Version Control", items: [] },
  { id: "collaboration", title: "Collaboration", items: [] },
  { id: "ai", title: "AI", items: [] },
  { id: "network", title: "Network", items: [] },
];
