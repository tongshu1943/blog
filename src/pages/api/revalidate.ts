import { NextApiRequest, NextApiResponse } from "next"
import { getPosts } from "../../apis"
import { CONFIG } from "site.config"

// for all path revalidate, https://<your-site.com>/api/revalidate?secret=<token>
// for specific path revalidate, https://<your-site.com>/api/revalidate?secret=<token>&path=<path>
// example, https://<your-site.com>/api/revalidate?secret=이것은_키&path=feed
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { secret, path } = req.query

  if (secret !== CONFIG.revalidateSecret) {
    return res.status(401).json({ message: "Invalid token" })
  }

  try {
    if (path) {
      await res.revalidate(path as string)
      console.log(`Successfully revalidated path: ${path}`)
    } else {
      const posts = await getPosts()
      console.log(`Revalidating ${posts.length} posts`)
      const batchSize = 10 // 每批处理的页面数量
      for (let i = 0; i < posts.length; i += batchSize) {
        const batch = posts.slice(i, i + batchSize)
        const results = await Promise.allSettled(
          batch.map(async (post) => {
            try {
              await res.revalidate(`/${post.slug}`)
              return `Successfully revalidated: /${post.slug}`
            } catch (error) {
              return `Failed to revalidate: /${post.slug}`
            }
          })
        )
        console.log(`Batch ${i / batchSize + 1} results:`, results)
      }
      await res.revalidate("/")
    }

    return res.json({ revalidated: true, message: "Revalidation complete" })
  } catch (err) {
    console.error('Error during revalidation:', err)
    return res.status(500).json({ message: "Error revalidating", error: err instanceof Error ? err.message : String(err) })
  }
}
