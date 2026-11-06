/* Generated from content/catalog.json. */
window.LLMCatalog = {
  "checked": "2026-11-06",
  "defaultModel": "qwen2.5-coder:1.5b",
  "models": {
    "qwen2.5-coder:0.5b": {
      "name": "Qwen2.5-Coder",
      "scale": "0.5B",
      "size": "398 MB",
      "purpose": "動作確認を優先",
      "ram": "8 GB未満では実験的",
      "vram": "GPUなしでも試行可・低速の場合あり",
      "description": "最も小さい候補。回答の品質は限定的です。RAMが8 GB未満のPCでは標準コースの動作を保証できません。",
      "source": "https://ollama.com/library/qwen2.5-coder:0.5b",
      "license": "https://huggingface.co/Qwen/Qwen2.5-Coder-0.5B-Instruct"
    },
    "qwen2.5-coder:1.5b": {
      "name": "Qwen2.5-Coder",
      "scale": "1.5B",
      "size": "986 MB",
      "purpose": "はじめの1台に",
      "ram": "8 GB以上から試す目安",
      "vram": "専用GPUは必須ではない",
      "description": "短いコードの説明や、小さなHTMLを試すための軽量候補。最初はこのモデルで、PCへの負荷と回答の様子を確かめます。",
      "source": "https://ollama.com/library/qwen2.5-coder:1.5b",
      "license": "https://huggingface.co/Qwen/Qwen2.5-Coder-1.5B-Instruct"
    },
    "qwen2.5-coder:7b": {
      "name": "Qwen2.5-Coder",
      "scale": "7B",
      "size": "4.7 GB",
      "purpose": "メモリに余裕があるPCに",
      "ram": "16〜32 GB以上から試す目安",
      "vram": "8 GB以上あればGPU実行を検討",
      "description": "もう少し長いコードの相談に試せる候補。1.5Bより多くのメモリを使います。GPUの対応状況と実際の速度を確認してください。",
      "source": "https://ollama.com/library/qwen2.5-coder:7b",
      "license": "https://huggingface.co/Qwen/Qwen2.5-Coder-7B-Instruct"
    },
    "qwen2.5-coder:14b": {
      "name": "Qwen2.5-Coder",
      "scale": "14B",
      "size": "9.0 GB",
      "purpose": "余裕のあるPCでの追加候補",
      "ram": "32 GB以上から慎重に試す目安",
      "vram": "16 GB以上あればGPU実行を検討",
      "description": "容量と処理負荷が大きい候補。小型モデルで接続を確認してから試しましょう。大きければ常に正確、という意味ではありません。",
      "source": "https://ollama.com/library/qwen2.5-coder:14b",
      "license": "https://huggingface.co/Qwen/Qwen2.5-Coder-14B-Instruct"
    }
  }
};
