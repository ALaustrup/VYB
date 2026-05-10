import { CreatePostCard } from "./_components/create-post-card";
import { FeedList } from "./_components/feed-list";

export default function FeedPage() {
  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-5 p-6">
      <CreatePostCard />
      <FeedList />
    </section>
  );
}
