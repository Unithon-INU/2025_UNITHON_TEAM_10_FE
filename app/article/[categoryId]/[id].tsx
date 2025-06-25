import ArticleApi from "@/api/article";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { ArticleInfo } from "../../(tabs)/board";
import { HStack } from "@/components/ui/hstack";
import { Avatar } from "@/components/ui/avatar";
import {
  AddIcon,
  EditIcon,
  Icon,
  MenuIcon,
  RemoveIcon,
  ThreeDotsIcon,
  TrashIcon,
  VerticalThreeDotsIcon,
} from "@/components/ui/icon";
import { FontAwesome, FontAwesome5, FontAwesome6 } from "@expo/vector-icons";
import { Alert, RefreshControl, ScrollView, StatusBar } from "react-native";
import { Button, ButtonIcon, ButtonText } from "@/components/ui/button";
import { Menu, MenuItem, MenuItemLabel } from "@/components/ui/menu";
import FocusAwareStatusBar from "@/components/ui/focus-aware-status-bar";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Divider } from "@/components/ui/divider";
import { Box } from "@/components/ui/box";
import { Input, InputField } from "@/components/ui/input";

export default function Page({}) {
  const { categoryId, id } = useLocalSearchParams<{
    categoryId: string;
    id: string;
  }>();

  const [initialized, setInitialized] = useState(false);

  const articleQuery = useQuery({
    queryKey: ["article", "single", categoryId, id],
    queryFn: ({ queryKey: [_, __, categoryId, id],  }) => {
      return ArticleApi.fetchArticle(categoryId, Number(id), initialized);
    },
  });

  useEffect(() => setInitialized(true), [articleQuery.isFetched])

  const articleOptions = articleQuery.data?.isAuthor
    ? [
        {
          name: "edit",
          label: "수정",
          icon: "edit",
        },
        {
          name: "delete",
          label: "삭제",
          icon: "trash",
        },
      ]
    : [];

  const commentOptions = [
    {
      name: "edit",
      label: "수정",
      icon: "edit",
    },
    {
      name: "delete",
      label: "삭제",
      icon: "trash",
    },
  ];
  const [comment, setComment] = useState("");
  const inset = useSafeAreaInsets();
  const submitComment = () => {
    ArticleApi.writeComment(categoryId, id, comment).then(() => {
      Alert.alert("알림", "댓글이 작성됐어요.")
      setComment('')
      articleQuery.refetch();
    }).catch(e => {
      Alert.alert("오류", "댓글 작성에 실패했어요.. 🥲")
    })
  }

  if (!articleQuery.data) return <Text>hi</Text>;

  return (
    <>
      <ScrollView
        refreshControl={
          <RefreshControl
            onRefresh={articleQuery.refetch}
            refreshing={articleQuery.isRefetching}
          />
        }
      >
        <FocusAwareStatusBar
          animated={true}
          backgroundColor={"white"}
          barStyle={"dark-content"}
        />
        <VStack className="p-5 gap-4 ">
          <VStack className="bg-white rounded-xl pl-5 py-5 gap-4 shadow-drop">
            <VStack className="gap-1">
              <HStack className="justify-between items-center">
                <Text className="text-title">{articleQuery.data?.title}</Text>
                {
                  // Todo: 수정/삭제 외에 추가 메뉴 생기면 권한에 따라 통제 필요
                  articleQuery.data?.isAuthor && (
                    <Menu
                      placement="bottom right"
                      className="bg-white rounded-xl"
                      trigger={({ ...triggerProps }) => (
                        <Button
                          {...triggerProps}
                          style={{ backgroundColor: "white" }}
                        >
                          <ButtonIcon
                            as={() => (
                              <FontAwesome5
                                name="ellipsis-v"
                                size={20}
                                color="black"
                              />
                            )}
                          />
                        </Button>
                      )}
                    >
                      {commentOptions.map((option) => (
                        <MenuItem key={option.name} textValue={option.label}>
                          <Icon
                            as={() => <FontAwesome5 name={option.icon} />}
                            size="md"
                          />
                          <MenuItemLabel size="md" className="ml-2">
                            {option.label}
                          </MenuItemLabel>
                        </MenuItem>
                      ))}
                    </Menu>
                  )
                }
              </HStack>
              <ArticleInfo
                author={articleQuery.data.author}
                createdAt={articleQuery.data.createdAt}
              />
            </VStack>
            <Text className="mb-6">{articleQuery.data?.content}</Text>
            <ArticleInfo
              viewCnt={articleQuery.data.viewCnt}
              align="right"
              className="pr-4"
            />
          </VStack>
          {articleQuery.data.comments.length > 0 && (
            <VStack className="bg-white rounded-xl py-5 pl-5 gap-4 shadow-drop">
              <HStack className="items-center gap-2 mb-2">
                <Text className="text-title">댓글</Text>
                <Text className="text-highlight-md">
                  {articleQuery.data.comments.length}
                </Text>
              </HStack>
              {articleQuery.data?.comments?.map((comment, i) => (
                <>
                  <HStack className="gap-4 items-center ">
                    <Avatar />
                    <VStack className="flex-1">
                      <Text className="text-highlight-md">
                        {comment.author}
                      </Text>
                    </VStack>
                    {
                      // Todo: 수정/삭제 외에 추가 메뉴 생기면 권한에 따라 통제 필요
                      comment.isAuthor && (
                        <Menu
                          placement="bottom right"
                          className="bg-white rounded-xl"
                          trigger={({ ...triggerProps }) => (
                            <Button
                              {...triggerProps}
                              style={{ backgroundColor: "white" }}
                            >
                              <ButtonIcon
                                as={() => (
                                  <FontAwesome5
                                    name="ellipsis-v"
                                    size={20}
                                    color="black"
                                  />
                                )}
                              />
                            </Button>
                          )}
                        >
                          {commentOptions.map((option) => (
                            <MenuItem
                              key={option.name}
                              textValue={option.label}
                            >
                              <Icon
                                as={() => <FontAwesome5 name={option.icon} />}
                                size="md"
                              />
                              <MenuItemLabel size="md" className="ml-2">
                                {option.label}
                              </MenuItemLabel>
                            </MenuItem>
                          ))}
                        </Menu>
                      )
                    }
                  </HStack>
                  <VStack className="pr-4 gap-4">
                    <Text>{comment.content}</Text>
                    {i < articleQuery.data.comments.length - 1 && (
                      <Divider
                        orientation="horizontal"
                        className="bg-placeholder"
                      />
                    )}
                  </VStack>
                </>
              ))}
            </VStack>
          )}
        </VStack>
      </ScrollView>
      <HStack className="gap-2 bg-white py-5 pl-4 pr-3 shadow-drop rounded-xl" style={{paddingBottom: inset.bottom + 20}}>
        <Input className="rounded-lg border-[1px] text-center drop-shadow-xl flex-1">
          <InputField value={comment} onChangeText={setComment}></InputField>
        </Input>
        <Button className="rounded-lg" onPress={submitComment}>
          <ButtonText>작성</ButtonText>
        </Button>
      </HStack>
    </>
  );
}
