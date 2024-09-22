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
    } else {
      const posts = await getPosts()
      const revalidatePromises = posts.map(post => res.revalidate(`/${post.slug}`))
      await Promise.all(revalidatePromises)
      await res.revalidate("/")
    }

    return res.json({ revalidated: true })
  } catch (err) {
    return res.status(500).json({ message: "Error revalidating", error: err instanceof Error ? err.message : String(err) })
  }
}
