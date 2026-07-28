import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  onSnapshot,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "../firebase";
import { Post, Comment, Notification, User } from "../types";

// Sync Posts
export const subscribePosts = (onUpdate: (posts: Post[]) => void) => {
  const postsCollection = collection(db, "posts");
  return onSnapshot(
    postsCollection,
    (snapshot) => {
      const posts: Post[] = [];
      snapshot.forEach((docSnap) => {
        posts.push(docSnap.data() as Post);
      });
      // Sort newest first
      posts.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      onUpdate(posts);
    },
    (error) => {
      console.error("Error subscribing to posts:", error);
    }
  );
};

export const savePostToFirestore = async (post: Post) => {
  try {
    await setDoc(doc(db, "posts", post.id), post, { merge: true });
  } catch (err) {
    console.error("Error saving post to Firestore:", err);
  }
};

export const deletePostFromFirestore = async (postId: string) => {
  try {
    await deleteDoc(doc(db, "posts", postId));
  } catch (err) {
    console.error("Error deleting post from Firestore:", err);
  }
};

// Sync Comments
export const subscribeComments = (onUpdate: (comments: Comment[]) => void) => {
  const commentsCollection = collection(db, "comments");
  return onSnapshot(
    commentsCollection,
    (snapshot) => {
      const comments: Comment[] = [];
      snapshot.forEach((docSnap) => {
        comments.push(docSnap.data() as Comment);
      });
      comments.sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      onUpdate(comments);
    },
    (error) => {
      console.error("Error subscribing to comments:", error);
    }
  );
};

export const saveCommentToFirestore = async (comment: Comment) => {
  try {
    await setDoc(doc(db, "comments", comment.id), comment, { merge: true });
  } catch (err) {
    console.error("Error saving comment to Firestore:", err);
  }
};

// Sync Notifications
export const subscribeNotifications = (
  userId: string,
  onUpdate: (notifications: Notification[]) => void
) => {
  const notificationsCollection = collection(db, "notifications");
  return onSnapshot(
    notificationsCollection,
    (snapshot) => {
      const notifications: Notification[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as Notification;
        if (data.userId === userId || data.userId === "all" || data.userId === "admin") {
          notifications.push(data);
        }
      });
      notifications.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      onUpdate(notifications);
    },
    (error) => {
      console.error("Error subscribing to notifications:", error);
    }
  );
};

export const saveNotificationToFirestore = async (notification: Notification) => {
  try {
    await setDoc(doc(db, "notifications", notification.id), notification, { merge: true });
  } catch (err) {
    console.error("Error saving notification to Firestore:", err);
  }
};

export const markAllNotificationsReadInFirestore = async (notifications: Notification[]) => {
  try {
    for (const notif of notifications) {
      if (!notif.read) {
        await updateDoc(doc(db, "notifications", notif.id), { read: true });
      }
    }
  } catch (err) {
    console.error("Error marking notifications read:", err);
  }
};

// Sync User
export const saveUserToFirestore = async (user: User) => {
  try {
    await setDoc(doc(db, "users", user.id), user, { merge: true });
  } catch (err) {
    console.error("Error saving user to Firestore:", err);
  }
};

export const fetchUserFromFirestore = async (userId: string): Promise<User | null> => {
  try {
    const docRef = doc(db, "users", userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as User;
    }
  } catch (err) {
    console.error("Error fetching user from Firestore:", err);
  }
  return null;
};

export const subscribeUser = (userId: string, onUpdate: (user: User) => void) => {
  const docRef = doc(db, "users", userId);
  return onSnapshot(
    docRef,
    (docSnap) => {
      if (docSnap.exists()) {
        onUpdate(docSnap.data() as User);
      }
    },
    (error) => {
      console.error("Error subscribing to user:", error);
    }
  );
};
