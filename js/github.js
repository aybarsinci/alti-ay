// GitHub'a doğrudan yazma.
//
// Neden araya sunucu koymuyoruz: bu sitenin tek şartı uzun ömürlü olması.
// Bir Worker, bir alan adı, bir ödeme yöntemi — hepsi kaybolabilir; kaybolduğu
// gün yazma yolu da kapanır. GitHub API'si kaybolursa zaten deponun kendisi
// yok demektir, yani bu yol sitenin zaten taşıdığından fazla bağımlılık
// eklemiyor. Anahtar kaynak koda girmez; sadece yazan kişinin telefonunda
// localStorage'da durur.

import { REPO_OWNER, REPO_NAME, REPO_BRANCH } from "./config.js";

const REPO = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}`;

export const REPO_URL = `https://github.com/${REPO_OWNER}/${REPO_NAME}`;
export const REPO_ZIP_URL = `${REPO_URL}/archive/refs/heads/${REPO_BRANCH}.zip`;

export class GitHubError extends Error {
  constructor(status, detail) {
    super(explain(status, detail));
    this.name = "GitHubError";
    this.status = status;
  }
}

function explain(status, detail) {
  if (status === 401) return "Anahtar geçersiz ya da süresi dolmuş.";
  if (status === 403) return "Anahtarın bu depoya yazma yetkisi yok.";
  if (status === 404) return "Depo bulunamadı — anahtarın kapsamını kontrol et.";
  if (status === 409 || status === 422)
    return `GitHub isteği reddetti${detail ? `: ${detail}` : ""}. Depoda aynı anda başka bir değişiklik olmuş olabilir; tekrar dene.`;
  return `GitHub hatası (${status})${detail ? `: ${detail}` : ""}`;
}

async function api(token, path, options = {}) {
  const res = await fetch(REPO + path, {
    cache: "no-store",
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(typeof options.body === "string" ? { "Content-Type": "application/json" } : null),
      ...options.headers,
    },
  });

  if (!res.ok) {
    let detail = "";
    try {
      detail = (await res.json()).message || "";
    } catch {
      /* gövde boş ya da JSON değil */
    }
    throw new GitHubError(res.status, detail);
  }
  return res;
}

const json = async (...args) => (await api(...args)).json();

/**
 * Anahtarı doğrular. Kaydetme anında değil, girişte başarısız olsun diye:
 * kemoterapi gününde yazı yazıp "kaydedilemedi" görmek en kötü sıralama.
 */
export async function verifyAccess(token) {
  const repo = await json(token, "");
  if (!repo.permissions?.push) {
    throw new Error("Bu anahtar depoyu okuyabiliyor ama yazamıyor.");
  }
  return true;
}

/** Depodaki bir dosyanın güncel içeriği (düz metin). */
export async function readText(token, path) {
  const res = await api(token, `/contents/${path}?ref=${REPO_BRANCH}`, {
    headers: { Accept: "application/vnd.github.raw" },
  });
  return res.text();
}

// Blob -> base64. Parça parça: büyük dosyada String.fromCharCode(...bytes)
// çağrı yığınını taşırıyor.
async function toBase64(blob) {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  }
  return btoa(bin);
}

async function createBlob(token, file) {
  const body = file.blob
    ? { content: await toBase64(file.blob), encoding: "base64" }
    : { content: file.text, encoding: "utf-8" };
  const { sha } = await json(token, "/git/blobs", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return sha;
}

/**
 * Verilen dosyaları TEK commit'te işler.
 *
 * Contents API dosya başına bir commit atıyor; yazı gidip index.json giderken
 * bağlantı kopsa depoda listede görünmeyen bir yazı kalırdı. Git Data API ile
 * yazı + index.json + fotoğraf tek commit oluyor: ya hepsi ya hiçbiri.
 *
 * files: [{ path, text }] veya [{ path, blob }]
 */
export async function commitFiles(token, { message, files }) {
  const ref = await json(token, `/git/ref/heads/${REPO_BRANCH}`);
  const headSha = ref.object.sha;
  const head = await json(token, `/git/commits/${headSha}`);

  const shas = await Promise.all(files.map((f) => createBlob(token, f)));

  const tree = await json(token, "/git/trees", {
    method: "POST",
    body: JSON.stringify({
      base_tree: head.tree.sha,
      tree: files.map((f, i) => ({
        path: f.path,
        mode: "100644",
        type: "blob",
        sha: shas[i],
      })),
    }),
  });

  const commit = await json(token, "/git/commits", {
    method: "POST",
    body: JSON.stringify({ message, tree: tree.sha, parents: [headSha] }),
  });

  await api(token, `/git/refs/heads/${REPO_BRANCH}`, {
    method: "PATCH",
    body: JSON.stringify({ sha: commit.sha }),
  });

  return commit.sha;
}
