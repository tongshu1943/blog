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
  console.log('Received secret:', secret)
  console.log('Received path:', path)
  console.log('Config secret:', CONFIG.revalidateSecret)

  if (secret !== CONFIG.revalidateSecret) {
    console.log('Invalid token')
    return res.status(401).json({ message: "Invalid token" })
  }

  try {
    console.log('Starting revalidation process')
    if (path) {
      console.log(`Revalidating path: ${path}`)
      await res.revalidate(path as string)
    } else {
      const posts = await getPosts()
      console.log('Posts fetched:', posts.length)
      const revalidateRequests = posts.map((row) =>
        res.revalidate(`/${row.slug}`)
      )
      await Promise.all(revalidateRequests)
      await res.revalidate("/")
    }

    console.log('Revalidation successful')
    res.json({ revalidated: true })
  } catch (err) {
    console.error('Error during revalidation:', err)
    return res.status(500).json({ message: "Error revalidating", error: err instanceof Error ? err.message : String(err) })
  }
}
