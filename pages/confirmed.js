import React, {useState} from "react";
import { useRouter } from "next/router";
import Link from "next/link";
export default function confirmed({ data }) {
  const router = useRouter();
  return (
    <div>
      以下の項目で座席を予約しました。渉外からチケットを配布されるのをお待ちください。
      キャンセルする場合はチケットが配布された際に、お断りしてください。
      <ul>
        <li>{JSON.stringify(router.query)}</li>
      </ul>
      <Link href="/">続いて予約する。</Link>
    </div>
  );
}
