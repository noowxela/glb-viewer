import { useCallback, useMemo, useRef, useState } from "react";
import {
  FolderOpen,
  RotateCcw,
  RotateCw,
  Sparkles,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { toast } from "sonner";
import ModelViewer, {
  type ModelSource,
  type ViewerHandle,
} from "@/components/ModelViewer";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { isGltfFile } from "@/lib/gltf";
import { cn } from "@/lib/utils";

/*
Author: Karol Miklas (https://sketchfab.com/karolmiklas)
License: CC-BY-SA-4.0 (http://creativecommons.org/licenses/by-sa/4.0/)
Source: https://sketchfab.com/3d-models/free-porsche-911-carrera-4s-d01b254483794de3819786d93e0e1ebf
Title: (FREE) Porsche 911 Carrera 4S
This file is a transformed copy of that model.
*/
const SAMPLE_MODEL: ModelSource = {
  kind: "url",
  url: `${import.meta.env.BASE_URL}models/911-transformed.glb`,
};

const PORSCHE_SOURCE =
  "https://sketchfab.com/3d-models/free-porsche-911-carrera-4s-d01b254483794de3819786d93e0e1ebf";
const PORSCHE_LICENSE = "https://creativecommons.org/licenses/by-sa/4.0/";

export default function Home() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const viewerRef = useRef<ViewerHandle | null>(null);
  const [source, setSource] = useState<ModelSource | null>(SAMPLE_MODEL);
  const [fileName, setFileName] = useState("911-transformed.glb");
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [autoRotate, setAutoRotate] = useState(true);
  const [studioEnv, setStudioEnv] = useState(false);
  const [dragging, setDragging] = useState(false);

  const progressLabel = useMemo(
    () => `${Math.round(progress * 100)}%`,
    [progress]
  );

  const openFiles = useCallback((files: FileList | File[] | null) => {
    const file = files?.[0];
    if (!file) return;

    if (!isGltfFile(file)) {
      toast.error("Please choose a .glb or .gltf file");
      return;
    }

    setFileName(file.name);
    setLoading(true);
    setProgress(0);
    setSource({ kind: "file", file });
  }, []);

  const onDrop = (event: React.DragEvent<HTMLElement>) => {
    event.preventDefault();
    setDragging(false);
    openFiles(event.dataTransfer.files);
  };

  return (
    <div className="flex h-screen w-full flex-col bg-background">
      <header className="border-b border-border bg-card shadow-sm">
        <div className="flex h-auto min-h-16 flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-foreground sm:text-2xl">
              GLB Viewer
            </h1>
            <p className="truncate text-sm text-muted-foreground">
              {fileName
                ? `Viewing ${fileName}`
                : "Open a .glb / .gltf file to inspect it"}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".glb,.gltf,model/gltf-binary,model/gltf+json"
              className="sr-only"
              onChange={(event) => {
                openFiles(event.target.files);
                event.target.value = "";
              }}
            />
            <Button
              variant="default"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <FolderOpen className="size-4" />
              Open GLB
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => viewerRef.current?.zoomBy(0.8)}
              title="Zoom in"
            >
              <ZoomIn className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => viewerRef.current?.zoomBy(1.25)}
              title="Zoom out"
            >
              <ZoomOut className="size-4" />
            </Button>
            <Button
              variant={autoRotate ? "secondary" : "outline"}
              size="sm"
              onClick={() => setAutoRotate((value) => !value)}
              title="Toggle auto rotate"
            >
              <RotateCw className="size-4" />
              {autoRotate ? "Spinning" : "Spin"}
            </Button>
            <Button
              variant={studioEnv ? "secondary" : "outline"}
              size="sm"
              onClick={() => setStudioEnv((value) => !value)}
              title="Toggle studio environment lighting"
            >
              <Sparkles className="size-4" />
              {studioEnv ? "Studio on" : "Studio"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => viewerRef.current?.resetView()}
            >
              <RotateCcw className="size-4" />
              Reset
            </Button>
          </div>
        </div>
      </header>

      <main
        className="relative min-h-0 flex-1 overflow-hidden"
        onDragEnter={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          if (event.currentTarget.contains(event.relatedTarget as Node)) return;
          setDragging(false);
        }}
        onDrop={onDrop}
      >
        <ModelViewer
          source={source}
          autoRotate={autoRotate}
          studioEnv={studioEnv}
          onReady={(handle) => {
            viewerRef.current = handle;
          }}
          onProgress={setProgress}
          onLoaded={() => setLoading(false)}
          onError={(message) => {
            setLoading(false);
            toast.error(message);
          }}
        />

        {loading && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/40">
            <Spinner className="size-8 text-primary" />
            <p className="text-sm font-medium text-foreground">
              {progress > 0
                ? `Loading model ${progressLabel}`
                : "Loading model…"}
            </p>
          </div>
        )}

        <div
          className={cn(
            "pointer-events-none absolute inset-4 flex items-center justify-center rounded-xl border-2 border-dashed border-primary bg-primary/10 text-primary transition-opacity",
            dragging ? "opacity-100" : "opacity-0"
          )}
        >
          <p className="text-lg font-semibold">Drop a .glb file to view it</p>
        </div>
      </main>

      <footer className="border-t border-border bg-card py-3">
        <div className="space-y-1 px-4 text-xs text-muted-foreground sm:px-6">
          <p>
            Drag to rotate · Scroll to zoom · Right-click to pan · Drop a .glb
            anywhere to open it
          </p>
          {source?.kind === "url" && (
            <p>
              Porsche 911 Carrera 4S by{" "}
              <a
                className="underline underline-offset-2 hover:text-foreground"
                href="https://sketchfab.com/karolmiklas"
                target="_blank"
                rel="noreferrer"
              >
                Karol Miklas
              </a>
              , transformed.{" "}
              <a
                className="underline underline-offset-2 hover:text-foreground"
                href={PORSCHE_LICENSE}
                target="_blank"
                rel="noreferrer"
              >
                CC BY-SA 4.0
              </a>
              .{" "}
              <a
                className="underline underline-offset-2 hover:text-foreground"
                href={PORSCHE_SOURCE}
                target="_blank"
                rel="noreferrer"
              >
                Sketchfab
              </a>
            </p>
          )}
        </div>
      </footer>
    </div>
  );
}
