import ArticleApi from "@/api/article";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect } from "react";
import { ArticleInfo } from "../(tabs)/board";
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
import { RefreshControl, ScrollView, StatusBar } from "react-native";
import { Button, ButtonIcon } from "@/components/ui/button";
import { Menu, MenuItem, MenuItemLabel } from "@/components/ui/menu";
import FocusAwareStatusBar from "@/components/ui/focus-aware-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { Divider } from "@/components/ui/divider";
import { Box } from "@/components/ui/box";

export default function Page({}) {
  const { id } = useLocalSearchParams<{ id: string }>();
  const articleQuery = useQuery({
    queryKey: ["article", "single", id],
    queryFn: ({ queryKey: [_, __, id] }) => ArticleApi.fetchArticle(id),
  });

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

  if (!articleQuery.data) return <Text>hi</Text>;

  return (
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
              regDt={articleQuery.data.regDt}
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
                    <Text className="text-highlight-md">{comment.author}</Text>
                    <Text className="text-highlight-sm">
                      Lv. {comment.authorLv}
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
      <SafeAreaView />
    </ScrollView>
  );
}
