import { PortableText, type SanityDocument } from "next-sanity";
import imageUrlBuilder from "@sanity/image-url";
import type { SanityImageSource } from "@sanity/image-url/lib/types/types";
import { client } from "@/lib/sanity/client";
import Link from "next/link";
import Image from "next/image";

const POST_QUERY = `*[_type == "post" && slug.current == $slug][0]{
  _id,
  title,
  slug,
  publishedAt,
  mainImage,
  body,
  "category": categories[0]->title,
  "author": author->name
}`;

const { projectId, dataset } = client.config();
const urlFor = (source: SanityImageSource) =>
    projectId && dataset
        ? imageUrlBuilder({ projectId, dataset }).image(source)
        : null;

const options = { next: { revalidate: 30 } };

export default async function PostPage({
    params,
}: {
    params: { slug: string };
}) {
    const post = await client.fetch<SanityDocument>(POST_QUERY, params, options);
    const postImageUrl = post.mainImage
        ? urlFor(post.mainImage)?.width(1200).height(675).url()
        : null;

    return (
        <main className="container mx-auto min-h-screen max-w-3xl p-8">
            <Link href="/blog" className="inline-flex items-center space-x-2 text-sm text-muted-foreground hover:text-foreground mb-8">
                <span>← Back to blog</span>
            </Link>

            <article className="prose prose-neutral dark:prose-invert max-w-none">
                <h1 className="text-4xl font-bold mb-4">{post.title}</h1>

                <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-8">
                    {post.author && (
                        <>
                            <span>{post.author}</span>
                            <span>•</span>
                        </>
                    )}
                    <time dateTime={post.publishedAt}>
                        {new Date(post.publishedAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })}
                    </time>
                    {post.category && (
                        <>
                            <span>•</span>
                            <span>{post.category}</span>
                        </>
                    )}
                </div>

                {postImageUrl && (
                    <div className="relative aspect-video mb-8">
                        <Image
                            src={postImageUrl}
                            alt={post.title}
                            fill
                            className="object-cover rounded-xl"
                            priority
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                    </div>
                )}

                <div className="prose prose-neutral dark:prose-invert max-w-none">
                    {Array.isArray(post.body) && <PortableText value={post.body} />}
                </div>
            </article>
        </main>
    );
} 