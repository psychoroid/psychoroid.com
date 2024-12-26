import { type SanityDocument } from "next-sanity";
import { client } from '@/lib/sanity/client';
import BlogLayout from '@/components/blog/BlogLayout';

const POSTS_PER_PAGE = 2;

const POSTS_QUERY = `*[
  _type == "post"
  && defined(slug.current)
]|order(publishedAt desc){
  _id,
  title,
  slug,
  publishedAt,
  excerpt,
  mainImage,
  "category": categories[0]->title,
  "author": author->name,
  body
}`;

const options = { next: { revalidate: 30 } };

export default async function BlogPage({
    searchParams,
}: {
    searchParams: { page?: string }
}) {
    const currentPage = Number(searchParams.page) || 1;
    const posts = await client.fetch<SanityDocument[]>(POSTS_QUERY, {}, options);
    const totalPages = Math.ceil(posts.length / POSTS_PER_PAGE);

    const startIndex = (currentPage - 1) * POSTS_PER_PAGE;
    const paginatedPosts = posts.slice(startIndex, startIndex + POSTS_PER_PAGE);

    return (
        <BlogLayout
            posts={paginatedPosts}
            totalPages={totalPages}
            postsPerPage={POSTS_PER_PAGE}
            currentPage={currentPage}
        />
    );
} 