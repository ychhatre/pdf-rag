"use client"

import { useState, useEffect } from "react"
import { Upload, Plus, ArrowRight, Share2, Bookmark } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"

export default function HomePage() {
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [chatId, setChatId] = useState<string>("")
  const [isUploading, setIsUploading] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  // ---------------------------
  // 1) My Chats from localStorage
  const [myChats, setMyChats] = useState<string[]>([])

  useEffect(() => {
    // Load "myChats" from localStorage
    const storedChats = JSON.parse(localStorage.getItem("myChats") || "[]")
    setMyChats(storedChats)
  }, [])
  // ---------------------------

  const handlePdfUpload = async () => {
    if (!pdfFile) return
    setIsUploading(true)
    const formData = new FormData()
    formData.append("file", pdfFile)

    try {
      const res = await fetch("http://localhost:8000/upload-pdf", {
        method: "POST",
        body: formData,
      })
      const data = await res.json()
      console.log("data is: ", data)
      if (data.chat_id) {
        setChatId(data.chat_id)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsUploading(false)
    }
  }

  const handleNewChat = async () => {
    setIsCreating(true)
    try {
      const res = await fetch("http://localhost:8000/new", {
        method: "POST",
      })
      const data = await res.json()
      if (data.chat_id) {
        setChatId(data.chat_id)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted p-4 md:p-8">
      <div className="mx-auto max-w-2xl space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">RAG Chatbot</h1>
          <p className="text-muted-foreground">
            Upload a PDF to chat with its contents or start a new conversation
          </p>
        </div>

        {/* My Chats Section */}
        {myChats.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>My Chats</CardTitle>
              <CardDescription>
                Chats you have opened or created
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {myChats.map((id) => (
                  <li key={id} className="flex items-center justify-between">
                    <span>Chat ID: {id}</span>
                    <Link href={`/chat/${id}`}>
                      <Button variant="outline" size="sm">
                        Open
                      </Button>
                    </Link>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Upload PDF Section */}
        <Card>
          <CardHeader>
            <CardTitle>Upload PDF</CardTitle>
            <CardDescription>
              Create a new chat based on the contents of your PDF
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                className="w-full h-24 border-dashed"
                onClick={() => document.getElementById('pdf-upload')?.click()}
              >
                {pdfFile ? (
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="h-6 w-6" />
                    <span className="text-sm">{pdfFile.name}</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="h-6 w-6" />
                    <span className="text-sm">Choose PDF file</span>
                  </div>
                )}
              </Button>
              <input
                id="pdf-upload"
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => {
                  if (!e.target.files) return
                  setPdfFile(e.target.files[0])
                }}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full"
              onClick={handlePdfUpload}
              disabled={!pdfFile || isUploading}
            >
              {isUploading ? (
                "Uploading..."
              ) : (
                <span className="flex items-center gap-2">
                  Start Chat with PDF <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </Button>
          </CardFooter>
        </Card>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Or</span>
          </div>
        </div>

        {/* New Chat Section */}
        <Card>
          <CardHeader>
            <CardTitle>New Chat</CardTitle>
            <CardDescription>
              Start a fresh conversation without any PDF context
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              className="w-full"
              onClick={handleNewChat}
              disabled={isCreating}
            >
              <Plus className="mr-2 h-4 w-4" />
              {isCreating ? "Creating..." : "Create Empty Chat"}
            </Button>
          </CardContent>
        </Card>

        {/* If user just created or uploaded a chat, show an alert with that ID */}
        {chatId && (
          <Alert>
            <div className="flex flex-col space-y-4">
              <AlertDescription className="flex items-center justify-between">
                <span className="font-medium">Chat ID: {chatId}</span>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" asChild>
                    <Link href={`/chat/${chatId}`}>
                      <ArrowRight className="h-4 w-4" />
                      <span className="sr-only">Go to chat</span>
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      navigator.clipboard.writeText(
                        `${window.location.origin}/chat/${chatId}`
                      )
                    }
                  >
                    <Share2 className="h-4 w-4" />
                    <span className="sr-only">Copy link</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => window.location.href = `/chat/${chatId}`}
                  >
                    <Bookmark className="h-4 w-4" />
                    <span className="sr-only">Open chat</span>
                  </Button>
                </div>
              </AlertDescription>
            </div>
          </Alert>
        )}
      </div>
    </div>
  )
}
