import { Button } from "@ui/button";
import { Input } from "@ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@ui/select";
import { Switch } from "@ui/switch";
import type { SettingItem } from "../types";

interface SettingRowProps {
  item: SettingItem;
}

export function SettingRow({ item }: SettingRowProps) {
  return (
    <div className="flex items-center justify-between border-border border-b py-4 last:border-0">
      <div className="flex flex-col gap-1 pr-6">
        <h4 className="font-medium text-foreground text-sm">{item.title}</h4>
        {item.description && (
          <p className="text-muted-foreground text-xs">{item.description}</p>
        )}
      </div>

      <div className="flex shrink-0 items-center">
        {item.type === "switch" && (
          <Switch defaultChecked={item.defaultValue as boolean} />
        )}

        {item.type === "select" && item.options && (
          <Select defaultValue={item.defaultValue as string}>
            <SelectTrigger className="w-45">
              <SelectValue placeholder="Select option" />
            </SelectTrigger>
            <SelectContent>
              {item.options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {item.type === "button" && (
          <Button size="sm" variant="outline">
            {item.buttonText || "Edit"}
          </Button>
        )}

        {item.type === "input" && (
          <Input className="w-45" defaultValue={item.defaultValue as string} />
        )}
      </div>
    </div>
  );
}
