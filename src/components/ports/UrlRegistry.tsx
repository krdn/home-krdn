'use client';

/**
 * UrlRegistry 컴포넌트
 *
 * 서비스와 프로젝트의 URL을 통합하여 표시하는 컴포넌트입니다.
 * Ports 페이지에서 URL 참조 탭으로 사용됩니다.
 */

import { useState, useMemo } from 'react';
import {
  Rocket,
  Code,
  Github,
  FileText,
  Search,
  ChevronDown,
  ChevronRight,
  Server,
  FolderKanban,
  ExternalLink,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import type { Service } from '@/types/service';
import type { Project, ProjectLink } from '@/types/project';

/**
 * URL 항목 인터페이스
 * 서비스와 프로젝트 데이터를 통합하는 데 사용됩니다.
 */
interface UrlEntry {
  id: string;
  name: string;
  source: 'service' | 'project';
  category: string;
  port?: number;
  urls: {
    production?: string;
    development?: string;
    github?: string;
    docs?: string;
  };
}

interface UrlRegistryProps {
  services: Service[];
  projects: Project[];
}

/**
 * 서비스 데이터를 UrlEntry로 변환
 */
function serviceToUrlEntry(service: Service): UrlEntry {
  return {
    id: service.id,
    name: service.name,
    source: 'service',
    category: service.category,
    port: service.port,
    urls: {
      production: service.urls?.production ?? service.url,
      development:
        service.urls?.development ??
        (service.port ? `http://localhost:${service.port}` : undefined),
      github: service.githubUrl,
      docs: service.docsUrl,
    },
  };
}

/**
 * 프로젝트 데이터를 UrlEntry로 변환
 */
function projectToUrlEntry(project: Project): UrlEntry {
  const getUrl = (type: string): string | undefined =>
    project.links.find((l: ProjectLink) => l.type === type)?.url;

  return {
    id: project.id,
    name: project.name,
    source: 'project',
    category: project.category,
    urls: {
      production: getUrl('production') ?? getUrl('demo'),
      development: getUrl('development'),
      github: getUrl('github'),
      docs: getUrl('docs'),
    },
  };
}

/**
 * URL 링크 컴포넌트
 */
function UrlLink({
  url,
  icon: Icon,
  label,
  className,
}: {
  url: string;
  icon: React.ElementType;
  label: string;
  className: string;
}) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm transition-colors hover:underline ${className}`}
      title={label}
    >
      <Icon className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
      <span className="max-w-[200px] truncate">
        {url.replace(/^https?:\/\//, '')}
      </span>
      <ExternalLink className="h-3 w-3 opacity-50" aria-hidden="true" />
    </a>
  );
}

/**
 * URL 항목 카드 컴포넌트
 */
function UrlEntryCard({ entry }: { entry: UrlEntry }) {
  const hasAnyUrl =
    entry.urls.production ||
    entry.urls.development ||
    entry.urls.github ||
    entry.urls.docs;

  if (!hasAnyUrl) return null;

  return (
    <div className="rounded-lg border p-4 transition-colors hover:bg-muted/30">
      {/* 헤더 */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-medium">{entry.name}</span>
          {entry.port && (
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono text-muted-foreground">
              :{entry.port}
            </code>
          )}
        </div>
        <span
          className={`rounded-full px-2 py-0.5 text-xs ${
            entry.source === 'service'
              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
              : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
          }`}
        >
          {entry.source === 'service' ? 'Service' : 'Project'}
        </span>
      </div>

      {/* URL 목록 */}
      <div className="flex flex-wrap gap-2">
        {entry.urls.production && (
          <UrlLink
            url={entry.urls.production}
            icon={Rocket}
            label="Production"
            className="bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/30"
          />
        )}
        {entry.urls.development && (
          <UrlLink
            url={entry.urls.development}
            icon={Code}
            label="Development"
            className="bg-orange-50 text-orange-700 hover:bg-orange-100 dark:bg-orange-900/20 dark:text-orange-400 dark:hover:bg-orange-900/30"
          />
        )}
        {entry.urls.github && (
          <UrlLink
            url={entry.urls.github}
            icon={Github}
            label="GitHub"
            className="bg-gray-50 text-gray-700 hover:bg-gray-100 dark:bg-gray-900/20 dark:text-gray-400 dark:hover:bg-gray-900/30"
          />
        )}
        {entry.urls.docs && (
          <UrlLink
            url={entry.urls.docs}
            icon={FileText}
            label="Docs"
            className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-400 dark:hover:bg-indigo-900/30"
          />
        )}
      </div>
    </div>
  );
}

/**
 * 접을 수 있는 섹션 컴포넌트
 */
function CollapsibleSection({
  title,
  icon: Icon,
  count,
  children,
  defaultOpen = true,
}: {
  title: string;
  icon: React.ElementType;
  count: number;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="space-y-3">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center gap-2 rounded-lg p-2 text-left transition-colors hover:bg-muted/50"
        aria-expanded={isOpen}
      >
        {isOpen ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        )}
        <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
        <span className="font-semibold">{title}</span>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
          {count}
        </span>
      </button>

      {isOpen && <div className="space-y-3 pl-9">{children}</div>}
    </div>
  );
}

/**
 * UrlRegistry 메인 컴포넌트
 */
export function UrlRegistry({ services, projects }: UrlRegistryProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // 서비스와 프로젝트를 UrlEntry로 변환
  const allEntries = useMemo(() => {
    const serviceEntries = services
      .filter((s) => s.urls || s.url || s.port || s.githubUrl)
      .map(serviceToUrlEntry);

    const projectEntries = projects
      .filter((p) => p.links && p.links.length > 0)
      .map(projectToUrlEntry);

    return { serviceEntries, projectEntries };
  }, [services, projects]);

  // 검색 필터링
  const filteredEntries = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return allEntries;

    const filterFn = (entry: UrlEntry) =>
      entry.name.toLowerCase().includes(query) ||
      entry.category.toLowerCase().includes(query) ||
      Object.values(entry.urls).some((url) =>
        url?.toLowerCase().includes(query)
      );

    return {
      serviceEntries: allEntries.serviceEntries.filter(filterFn),
      projectEntries: allEntries.projectEntries.filter(filterFn),
    };
  }, [allEntries, searchQuery]);

  const totalCount =
    filteredEntries.serviceEntries.length + filteredEntries.projectEntries.length;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" aria-hidden="true" />
            URL 레지스트리
            <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-sm font-normal text-muted-foreground">
              {totalCount}개
            </span>
          </CardTitle>

          {/* 검색 */}
          <div className="relative w-full sm:w-64">
            <Search
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              type="search"
              placeholder="이름 또는 URL 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 pl-9 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              aria-label="URL 검색"
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {totalCount === 0 ? (
          <p className="py-8 text-center text-muted-foreground">
            {searchQuery
              ? '검색 결과가 없습니다.'
              : 'URL이 등록된 서비스나 프로젝트가 없습니다.'}
          </p>
        ) : (
          <>
            {/* 서비스 섹션 */}
            {filteredEntries.serviceEntries.length > 0 && (
              <CollapsibleSection
                title="Services"
                icon={Server}
                count={filteredEntries.serviceEntries.length}
              >
                {filteredEntries.serviceEntries.map((entry) => (
                  <UrlEntryCard key={`service-${entry.id}`} entry={entry} />
                ))}
              </CollapsibleSection>
            )}

            {/* 프로젝트 섹션 */}
            {filteredEntries.projectEntries.length > 0 && (
              <CollapsibleSection
                title="Projects"
                icon={FolderKanban}
                count={filteredEntries.projectEntries.length}
              >
                {filteredEntries.projectEntries.map((entry) => (
                  <UrlEntryCard key={`project-${entry.id}`} entry={entry} />
                ))}
              </CollapsibleSection>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
