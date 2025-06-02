import { HStack } from "../hstack";
import { VStack } from "../vstack";
import { Text } from "../text";

const Meter = ({
  children,
  unit,
  desc,
}: React.PropsWithChildren<{ unit: string; desc?: string }>) => {
  return (
    <VStack>
      <HStack className="flex-row justify-center">
        <Text className="text-highlight-md">{children} </Text>
        <Text>{unit}</Text>
      </HStack>
      {desc && <Text>{desc}</Text>}
    </VStack>
  );
};

export {Meter};

