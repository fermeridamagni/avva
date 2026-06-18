import { Input } from "@ui/input";
import { ScrollArea } from "@ui/scroll-area";
import { SearchIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { cn } from "tailwind-variants";
import { SettingRow } from "./components/setting-row";
import { settingsConfig } from "./config";

export default function SettingsTab() {
  const [activeCategory, setActiveCategory] = useState(settingsConfig[0].id);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) {
      return settingsConfig.filter((cat) => cat.id === activeCategory);
    }

    const query = searchQuery.toLowerCase();
    return settingsConfig
      .map((cat) => ({
        ...cat,
        items: cat.items.filter(
          (item) =>
            item.title.toLowerCase().includes(query) ||
            item.description?.toLowerCase().includes(query)
        ),
      }))
      .filter((cat) => cat.items.length > 0);
  }, [searchQuery, activeCategory]);

  return (
    <div className="flex h-full w-full overflow-hidden bg-background text-foreground">
      {/* Sidebar */}
      <div className="flex h-full w-64 shrink-0 flex-col border-border border-r bg-muted/20">
        <div className="border-border border-b p-4">
          <div className="relative">
            <SearchIcon className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              className="bg-background pl-9"
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search settings..."
              type="search"
              value={searchQuery}
            />
          </div>
        </div>
        <ScrollArea className="flex-1">
          <nav className="flex flex-col gap-1 p-2">
            {settingsConfig.map((category) => (
              <button
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors",
                  activeCategory === category.id && !searchQuery
                    ? "bg-accent font-medium text-accent-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
                key={category.id}
                onClick={() => {
                  setActiveCategory(category.id);
                  setSearchQuery("");
                }}
                type="button"
              >
                {category.title}
              </button>
            ))}
          </nav>
        </ScrollArea>
      </div>

      {/* Main Content */}
      <div className="flex h-full flex-1 flex-col overflow-hidden">
        <ScrollArea className="flex-1 p-6">
          <div className="mx-auto max-w-3xl">
            {filteredCategories.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <p>No settings found matching "{searchQuery}"</p>
              </div>
            ) : (
              <div className="flex flex-col gap-8 pb-10">
                {filteredCategories.map((category) => (
                  <section key={category.id}>
                    <h2 className="mb-4 font-semibold text-xl">
                      {category.title}
                    </h2>
                    {category.items.length > 0 ? (
                      <div className="flex flex-col divide-y divide-border rounded-lg border border-border bg-card/50 px-4">
                        {category.items.map((item) => (
                          <SettingRow item={item} key={item.id} />
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-sm italic">
                        No settings available in this category yet.
                      </p>
                    )}
                  </section>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
