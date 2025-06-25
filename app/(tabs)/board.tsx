import ArticleApi from "@/api/article";
import { Box } from "@/components/ui/box";
import FocusAwareStatusBar from "@/components/ui/focus-aware-status-bar";
import { HStack } from "@/components/ui/hstack";
import { Input, InputField } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { FontAwesome, MaterialIcons } from "@expo/vector-icons";
import { useInfiniteQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { useState, useMemo, } from "react";
import {
  Appearance,
  FlatList,
  SafeAreaView,
  StatusBar,
  TouchableHighlight,
  TouchableOpacity,
} from "react-native";

const Chip = ({
  children,
  onPress,
  selected,
}: React.PropsWithChildren<{
  onPress: () => void;
  selected: boolean;
}>) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      className={`bg-${
        selected ? "primary-100" : "white"
      } px-[10px] py-[5px] rounded-full`}
    >
      <Text className=" color-primary-500">{children}</Text>
    </TouchableOpacity>
  );
};

const ContentCard = ({
  title,
  content,
  bottomSlot,
  onPress,
}: {
  title: string;
  content: string;
  bottomSlot?: React.ReactNode;
  onPress?: () => void;
}) => {
  return (
    <TouchableOpacity onPress={onPress}>
      <VStack className="gap-8 bg-white p-4 rounded-xl shadow-drop overflow-visible">
        <VStack className="gap-2">
          <Text>{title}</Text>
          <Text className="text-description">{content}</Text>
        </VStack>
        {bottomSlot}
      </VStack>
    </TouchableOpacity>
  );
};

const ArticleInfo = ({
  author,
  createdAt,
  viewCnt,
  commentCnt,
  align = "left",
  className = "",
}: {
  author?: string;
  createdAt?: string;
  viewCnt?: number;
  commentCnt?: number;
  align?: "left" | "center" | "right";
  className?: string;
}) => {
  const alignMap = {
    left: "start",
    center: "center",
    right: "end",
  };
  return (
    <HStack className={`gap-3 justify-${alignMap[align]} items-center ${className}`}>
      {author && <Text>{author}</Text>}
      {createdAt && <Text>{createdAt}</Text>}
      {viewCnt && (
        <HStack className="gap-1 items-center">
          <FontAwesome name="eye"></FontAwesome>
          <Text>{viewCnt}</Text>
        </HStack>
      )}
      {commentCnt && (
        <HStack className="gap-1 items-center">
          <FontAwesome name="comment"></FontAwesome>
          <Text>{commentCnt}</Text>
        </HStack>
      )}
    </HStack>
  );
};

export { ArticleInfo };

export default function Page() {
  const [searchInput, setSearchInput] = useState("");
  const [searchBoxSize, setSearchBoxSize] = useState<{
    width?: number;
    height?: number;
  }>({});

  const phrases = [
    "햇반 용기, 어떻게 버려요?",
    "비닐봉투는 재활용될까요?",
    "유리병 라벨은 제거해야 하나요?",
    "컵라면 용기는 어떻게 버릴까요?",
    "칫솔은 일반 쓰레기인가요?",
  ];
  const placeHolder = useMemo(
    () => phrases[Math.floor(Math.random() * phrases.length)],
    []
  );

  const [selectedCategory, setSelectedCategory] = useState<string>("전체");
  const categories = ["자유게시판", "공지사항", "Q&A", "아티클"];
  
  const articleQuery = useInfiniteQuery({
    queryKey: ["articles", selectedCategory],
    queryFn: async ({ pageParam = 1, queryKey: [_, category]}) => {
      const response = await ArticleApi.fetchArticles({
        page: pageParam,
        category: category == '전체' ? 'all': category,
      });

      return response;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      console.log(lastPage)
      const nextPage = lastPage.currentPage + 1;
      return nextPage <= lastPage.totalPages ? nextPage : undefined;
    },
  });

  return (
    <>
      <SafeAreaView className="bg-primary-500" />
      <FocusAwareStatusBar
        animated={true}
        backgroundColor={"#5EDAA3"}
        barStyle={"light-content"}
      />
      <VStack className=" bg-primary-500 p-5 gap-3">
        <HStack className="justify-between">
          <Text className="text-highlight-lg " style={{ color: "white" }}>
            커뮤니티
          </Text>
          <TouchableOpacity
            className="bg-[#3EF4A4] aspect-square p-1 rounded-xl"
            onPress={() => router.push(`/article/${selectedCategory}/write`)}
          >
            <MaterialIcons name="add" color="white" size={30} />
          </TouchableOpacity>
        </HStack>
        <HStack className="justify-center  py-4 bg-background-500 rounded-xl">
          <MaterialIcons name="search" size={32} color="#6d6d6d" />
          <Input
            className="border-0 text-center drop-shadow-xl max-w-[80%]"
            style={{ width: (searchBoxSize?.width ?? 0) + 20 }}
          >
            <InputField
              placeholder={placeHolder}
              className="font-nanum-square"
              onChangeText={(text) => setSearchInput(text)}
              value={searchInput}
            />
            <Text
              onLayout={({ nativeEvent: { layout } }) => {
                setSearchBoxSize(layout);
              }}
              className="absolute opacity-0"
            >
              {searchInput.length > 0 ? searchInput : placeHolder}
            </Text>
          </Input>
        </HStack>
      </VStack>
      <VStack className=" gap-3">
        <HStack className="flex-nowrap gap-2 px-5 pt-5">
          {["전체", ...categories].map((category) => (
            <Chip
              onPress={function (): void {
                setSelectedCategory(category);
              }}
              selected={category === selectedCategory}
              key={category}
            >
              {category}
            </Chip>
          ))}
        </HStack>
        <FlatList
          data={articleQuery.data?.pages.flatMap((page) => page.posts)}
          contentContainerClassName="p-5 gap-5 h-full"
          refreshing={articleQuery.isRefetching}
          onRefresh={() => articleQuery.refetch()}
          renderItem={(data) => (
            <ContentCard
              onPress={() => router.push(`/article/${selectedCategory}/${data.item.id}`)}
              {...data.item}
              bottomSlot={<ArticleInfo {...data.item} />}
            />
          )}
        />
      </VStack>
    </>
  );
}
