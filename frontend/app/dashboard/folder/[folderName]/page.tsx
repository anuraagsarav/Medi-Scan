/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */

'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import jsPDF from 'jspdf';

export default function FolderDetailsPage() {
  type FileItem = {
    _id: string;
    fileUrl: string;
    originalName: string;
    createdAt: string;
    purpose: string;
  };

  const { folderName } = useParams();
  const router = useRouter();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [viewFile, setViewFile] = useState<string | null>(null);
  const [summaryDialogOpen, setSummaryDialogOpen] = useState(false);
  const [summaryText, setSummaryText] = useState('');
  const [isSummarizing, setIsSummarizing] = useState(false);

  useEffect(() => {
    fetchFiles();
  }, [folderName]);

  const fetchFiles = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/files?hospital=${folderName}`, {
        credentials: 'include',
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || 'Failed to fetch files');
      }

      const data = await res.json();
      setFiles(data);
    } catch (err) {
      console.error('Error fetching files:', err);
    }
  };

  const toggleSelect = (fileId: string) => {
    setSelectedFiles(prev =>
      prev.includes(fileId) ? prev.filter(f => f !== fileId) : [...prev, fileId]
    );
  };

  const handleDelete = async () => {
    try {
      await Promise.all(
        selectedFiles.map(fileId =>
          fetch(`http://localhost:5000/api/files/${fileId}`, {
            method: 'DELETE',
            credentials: 'include'
          })
        )
      );
      toast.success('Files deleted successfully');
      setSelectedFiles([]);
      fetchFiles();
    } catch (err) {
      console.error('Delete error:', err);
      toast.error('Error deleting files');
    }
  };

  const downloadSummary = () => {
    const doc = new jsPDF();
    const lines = doc.splitTextToSize(summaryText, 180);
    doc.text(lines, 10, 10);
    doc.save('summary.pdf');
  };

  const cleanSummary = (text: string) => {
    return text
      .replace(/[\*#`|\-]+/g, '')
      .replace(/^\s*\n/gm, '')
      .replace(/\n{2,}/g, '\n')
      .trim();
  };

  const summarizeFile = async (file: FileItem) => {
    try {
      setIsSummarizing(true);
      toast.loading('Checking for existing summary...');

      // Get signed URL for the file
      const res = await fetch(`http://localhost:5000/api/files/signed-url?fileUrl=${encodeURIComponent(file.fileUrl)}`, {
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error('Failed to get signed URL');
      }

      const data = await res.json();
      
      if (!data.signedUrl) {
        throw new Error('Invalid signed URL response');
      }

      // Generate new summary
      toast.loading('Generating summary...');
      const summaryRes = await fetch('http://localhost:5000/api/pdf/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          fileUrl: data.signedUrl,
          fileId: file._id 
        }),
      });

      let result = await summaryRes.json();

      // If generation failed or no summary in response, try to get from cache
      if (!summaryRes.ok || !result.summary) {
        toast.loading('Checking cache...');
        const cachedRes = await fetch(`http://localhost:5000/api/pdf/summary/${file._id}`, {
          credentials: 'include',
        });
        
        if (cachedRes.ok) {
          result = await cachedRes.json();
        }
      }

      // If we have a summary from either source, display it
      if (result.summary) {
        setSummaryText(cleanSummary(result.summary));
        setSummaryDialogOpen(true);
        toast.success(result.fromCache ? 'Retrieved from cache!' : 'Summary generated successfully!');
      } else {
        throw new Error('No summary available');
      }

    } catch (err: any) {
      console.error('Summarization error:', err);
      toast.error(err.message || 'Failed to summarize PDF');
      
      // One final attempt to get cached version if we haven't already
      try {
        const cachedRes = await fetch(`http://localhost:5000/api/pdf/summary/${file._id}`, {
          credentials: 'include',
        });
        
        if (cachedRes.ok) {
          const cachedData = await cachedRes.json();
          if (cachedData.summary) {
            setSummaryText(cleanSummary(cachedData.summary));
            setSummaryDialogOpen(true);
            toast.success('Retrieved cached summary!');
          }
        }
      } catch (cacheErr) {
        // Ignore cache fetch errors
      }
    } finally {
      setIsSummarizing(false);
      toast.dismiss();
    }
  };

  return (
    <div className="p-8 w-full max-w-6xl mx-auto space-y-6">
      <h2 className="text-3xl font-bold mb-4 text-white">
        Hospital Name: {decodeURIComponent(folderName as string)}
      </h2>

      {files.length === 0 ? (
        <p className="text-white">No files uploaded yet.</p>
      ) : (
        <div className="space-y-4">
          {files.map(file => (
            <div
              key={file._id}
              className="border border-white/20 rounded-lg p-4 bg-white text-black flex justify-between items-center"
            >
              <div className="space-y-1">
                <p
                  className="font-semibold cursor-pointer underline"
                  onClick={async () => {
                    try {
                      const res = await fetch(`http://localhost:5000/api/files/signed-url?fileUrl=${encodeURIComponent(file.fileUrl)}`, {
                        credentials: 'include'
                      });

                      if (!res.ok) throw new Error('Failed to fetch signed URL');
                      const data = await res.json();
                      setViewFile(data.signedUrl);
                    } catch (err) {
                      toast.error('Could not load file preview.');
                      console.error('Signed URL Error:', err);
                    }
                  }}
                >
                  {file.originalName}
                </p>
                <p className="text-sm text-gray-700">Uploaded: {new Date(file.createdAt).toLocaleString()}</p>
                <p className="text-sm text-gray-700">Purpose: {file.purpose}</p>
              </div>
              <div className="flex items-center gap-4">
                <Checkbox
                  checked={selectedFiles.includes(file._id)}
                  onCheckedChange={() => toggleSelect(file._id)}
                />
                <Button onClick={() => summarizeFile(file)} className="bg-blue-500 hover:bg-blue-600 text-white">
                  Summarize
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!viewFile} onOpenChange={() => setViewFile(null)}>
        <DialogContent className="w-full max-w-3xl">
          <DialogTitle>Preview File</DialogTitle>
          {viewFile && (
            <iframe
              src={viewFile}
              className="w-full h-[80vh] rounded-md"
              onError={() => toast.error("Unable to load file")}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={summaryDialogOpen} onOpenChange={setSummaryDialogOpen}>
        <DialogContent className="bg-neutral-900 border border-white/20 text-white max-w-3xl">
          <DialogTitle>Summary</DialogTitle>
          <div className="whitespace-pre-wrap max-h-[60vh] overflow-y-auto text-sm text-white border p-4 rounded-lg bg-neutral-800">
            {summaryText}
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={downloadSummary} className="border border-white text-white bg-black hover:bg-neutral-800">
              Download as PDF
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="sticky bottom-0 bg-black py-4 mt-8 flex justify-between items-center border-t border-white/20">
        <Button onClick={() => router.push('/dashboard')} className="bg-gray-500 text-white">
          ← Go Back
        </Button>
        <Button onClick={handleDelete} className="bg-red-500 text-white hover:bg-red-600">
          Delete Selected
        </Button>
      </div>
    </div>
  );
}
