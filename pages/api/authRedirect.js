export default function handler(_, res) {
  res.statusCode = 401
  res.setHeader('WWW-authenticate', 'Basic realm="Secure Area"')
  res.end("authentication is required.\n（管理者用のページです。パスワードを知らない場合は渉外に聞くか、トップページからチケットを申請してください。）")
}