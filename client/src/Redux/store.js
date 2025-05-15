import { configureStore } from "@reduxjs/toolkit";
import UserSlice from "./UserSlice";
import FreelancerSlice from "./FreelancerSlice";
import ClientSlice from "./ClientSlice";
import ChatSlice from "./ChatSlice";
import ProjectSlice from "./ProjectSlice";
import NotificationSlice from "./NotificationSlice";

export const store = configureStore({
  reducer: {
    user: UserSlice,
    freelancer: FreelancerSlice,
    client: ClientSlice,
    chat: ChatSlice,
    project: ProjectSlice,
    notification: NotificationSlice,
  },
});
