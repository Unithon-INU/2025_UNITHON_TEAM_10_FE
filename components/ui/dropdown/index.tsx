import { FontAwesome, FontAwesome5 } from "@expo/vector-icons";
import { Button, ButtonIcon } from "../button";
import { Menu, MenuItem, MenuItemLabel } from "../menu";
import { Icon } from "../icon";

export default function DropdownMenu({
  options,
  trigger,
}: {
  options: {
    name: string;
    label: string;
    icon: keyof typeof FontAwesome.glyphMap;
  }[];
  trigger: (
    _props: any,
    state: {
      open: boolean;
    }
  ) => JSX.Element;
}) {
  return (
    <Menu
      placement="bottom right"
      className="bg-white rounded-xl"
      trigger={({ ...triggerProps }) => (
        <Button {...triggerProps} style={{ backgroundColor: "white" }}>
          <ButtonIcon
            as={() => (
              <FontAwesome5 name="ellipsis-v" size={20} color="black" />
            )}
          />
        </Button>
      )}
    >
      {options.map((option) => (
        <MenuItem key={option.name} textValue={option.label}>
          <Icon as={() => <FontAwesome5 name={option.icon} />} size="md" />
          <MenuItemLabel size="md" className="ml-2">
            {option.label}
          </MenuItemLabel>
        </MenuItem>
      ))}
    </Menu>
  );
}
