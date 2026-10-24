/* eslint-disable @next/next/no-img-element */
"use client";

import { Icons } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ArrowUpRight, Download, Hammer } from "lucide-react";
import { useState } from "react";
import Markdown from "react-markdown";

const LINK_ICONS = {
  globe: Icons.globe,
  github: Icons.github,
  download: Download,
  hammer: Hammer,
} as const;

type CardLink = {
  type: string;
  href: string;
  icon: keyof typeof LINK_ICONS;
  chrome?: boolean;
  destroy?: boolean;
};

function ProjectImage({ src, alt }: { src: string; alt: string }) {
  const [imageError, setImageError] = useState(false);

  if (!src || imageError) {
    return <div className="w-full h-48 bg-muted" />;
  }

  return (
    <img
      src={src}
      alt={alt}
      width={800}
      height={500}
      loading="lazy"
      decoding="async"
      className="w-full h-48 object-cover object-top"
      onError={() => setImageError(true)}
    />
  );
}

function LinkBadge({ link }: { link: CardLink }) {
  const Icon = LINK_ICONS[link.icon];
  const content = (
    <Badge
      className="flex items-center gap-1.5 text-xs bg-black text-white hover:bg-black/90"
      variant="default"
    >
      <Icon className="size-3" aria-hidden />
      <span data-chrome-label={link.chrome ? "" : undefined}>{link.type}</span>
    </Badge>
  );

  // Wired up by /page-destroyer/store.js, which this page loads.
  if (link.destroy) {
    return (
      <button type="button" data-destroy-here className="cursor-pointer">
        {content}
      </button>
    );
  }
  if (link.chrome) {
    return (
      <a href={link.href} download="page-destroyer.zip" data-chrome-link>
        {content}
      </a>
    );
  }
  return (
    <a href={link.href} target="_blank" rel="noopener noreferrer">
      {content}
    </a>
  );
}

interface Props {
  title: string;
  href: string;
  description: string;
  dates: string;
  tags: readonly string[];
  image?: string;
  imageAlt?: string;
  links?: readonly CardLink[];
  className?: string;
}

export function ProjectCard({
  title,
  href,
  description,
  dates,
  tags,
  image,
  imageAlt,
  links,
  className,
}: Props) {
  const external = href.startsWith("http");
  const target = external ? { target: "_blank", rel: "noopener noreferrer" } : {};

  return (
    <article
      className={cn(
        "flex flex-col h-full border border-border rounded-xl overflow-hidden hover:ring-2 hover:ring-muted transition-all duration-200",
        className
      )}
    >
      <div className="relative shrink-0">
        <a href={href} {...target} className="block" tabIndex={-1} aria-hidden>
          <ProjectImage src={image ?? ""} alt={imageAlt ?? title} />
        </a>
        {links && links.length > 0 && (
          <div className="absolute top-2 right-2 flex flex-wrap justify-end gap-2">
            {links.map((link) => (
              <LinkBadge key={link.type} link={link} />
            ))}
          </div>
        )}
      </div>
      <div className="p-6 flex flex-col gap-3 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-1">
            <h3 className="font-semibold">{title}</h3>
            <time className="text-xs text-muted-foreground">{dates}</time>
          </div>
          <a
            href={href}
            {...target}
            className="text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
            aria-label={`Open ${title}`}
          >
            <ArrowUpRight className="h-4 w-4" aria-hidden />
          </a>
        </div>
        <div className="text-xs flex-1 prose max-w-full text-pretty font-sans leading-relaxed text-muted-foreground dark:prose-invert">
          <Markdown>{description}</Markdown>
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-auto">
            {tags.map((tag) => (
              <Badge
                key={tag}
                className="text-[11px] font-medium border border-border h-6 w-fit px-2"
                variant="outline"
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
