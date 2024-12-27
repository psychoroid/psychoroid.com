'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useTranslation } from '@/lib/contexts/TranslationContext';
import { t } from '@/lib/i18n/translations';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { type SanityDocument } from "next-sanity";
import imageUrlBuilder from "@sanity/image-url";
import { client } from "@/lib/sanity/client";

const builder = imageUrlBuilder(client);

interface BlogLayoutProps {
    posts: SanityDocument[];
    totalPages: number;
    postsPerPage: number;
    currentPage?: number;
}

export default function BlogLayout({ posts, totalPages, postsPerPage, currentPage = 1 }: BlogLayoutProps) {
    const { currentLanguage } = useTranslation();

    return (
        <div className="grid grid-cols-12 gap-8">
            {/* Left side - Title */}
            <div className="col-span-4">
                <div className="flex flex-col space-y-1 mt-3">
                    <h1 className="text-xl font-semibold text-foreground">
                        {t(currentLanguage, 'blog.title')}
                    </h1>
                    <p className="text-xs text-muted-foreground">
                        {t(currentLanguage, 'blog.subtitle')}
                    </p>
                </div>
            </div>

            {/* Right side - Blog Posts */}
            <div className="col-span-8">
                <div className="divide-y divide-border">
                    {posts.map((post) => (
                        <article key={post._id} className="group py-10 first:pt-6 last:pb-0">
                            <Link href={`/blog/${post.slug.current}`} className="block space-y-3">
                                <div className="flex gap-6">
                                    {post.mainImage && (
                                        <div className="relative flex-shrink-0 w-[70px] h-[70px] overflow-hidden rounded-lg border border-border">
                                            <Image
                                                src={builder.image(post.mainImage).width(250).height(250).url()}
                                                alt={post.title}
                                                fill
                                                className="object-cover"
                                            />
                                        </div>
                                    )}
                                    <div className="flex-grow space-y-3">
                                        <div className="flex items-center space-x-2 text-xs">
                                            {post.category && (
                                                <>
                                                    <Badge variant="outline" className="rounded-none text-xs px-2 py-0 border-primary/20 text-primary hover:bg-primary/5">
                                                        {post.category}
                                                    </Badge>
                                                    <span className="text-muted-foreground">•</span>
                                                </>
                                            )}
                                            <span className="text-muted-foreground">5 min read</span>
                                        </div>
                                        <h2 className="text-xl font-medium text-foreground group-hover:text-primary transition-colors">
                                            {post.title}
                                        </h2>
                                        {post.excerpt && (
                                            <p className="text-sm text-muted-foreground leading-relaxed">
                                                {post.excerpt}
                                            </p>
                                        )}
                                        <div className="flex items-center space-x-2 pt-2">
                                            {post.author && (
                                                <>
                                                    <span className="text-xs font-medium">
                                                        {post.author}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground">•</span>
                                                </>
                                            )}
                                            <span className="text-xs text-muted-foreground">
                                                {new Date(post.publishedAt).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        </article>
                    ))}
                </div>

                {totalPages > 1 && (
                    <div className="flex items-center justify-between pt-8 mt-8 border-t border-border">
                        <div className="text-sm text-muted-foreground">
                            {postsPerPage} {t(currentLanguage, 'ui.community.perPage')}
                        </div>
                        <div className="flex items-center gap-2">
                            <Link href={currentPage === 1 ? '#' : `/blog?page=${currentPage - 1}`}>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    disabled={currentPage === 1}
                                    className="rounded-none"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                            </Link>
                            <span className="text-sm">
                                {t(currentLanguage, 'ui.community.page')} {currentPage} {t(currentLanguage, 'ui.community.of')} {totalPages}
                            </span>
                            <Link href={currentPage === totalPages ? '#' : `/blog?page=${currentPage + 1}`}>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    disabled={currentPage === totalPages}
                                    className="rounded-none"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
} 