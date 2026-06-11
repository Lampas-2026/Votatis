import { AwsClient } from "aws4fetch";
import type { Env } from "./types";

/**
 * R2 객체에 대한 presigned PUT URL을 발급한다 (aws4fetch, Workers 호환).
 * Content-Type 은 서명에 포함하지 않는다 — signQuery 사용 시 브라우저가 보내는
 * 비서명 헤더로 인해 업로드가 403 되는 문제를 피한다.
 */
export async function presignPut(env: Env, key: string, expiresSeconds = 300): Promise<string> {
  const client = new AwsClient({
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    service: "s3",
    region: "auto",
  });

  const url = new URL(
    `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${env.R2_BUCKET}/${key}`,
  );
  url.searchParams.set("X-Amz-Expires", String(expiresSeconds));

  const signed = await client.sign(new Request(url, { method: "PUT" }), {
    aws: { signQuery: true },
  });
  return signed.url;
}
