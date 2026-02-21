# ER図のエンティティ配置最適化を、数理最適化として読む

`spec/entity_layout_optimization.md` と実装（主に `public/src/utils/layoutOptimizer.ts` と `public/src/workers/layoutWorker.ts`）を読むと、この機能は「厳密最適化」ではなく「多目的最適化をヒューリスティックで近似」する設計になっています。

> **ヒューリスティック（heuristic）**: 最適解の保証はないが、実用上十分な解を短時間で得るための経験的手法のことです。厳密解法が計算量的に困難な問題で広く使われます。

この記事では、使っている技術を数理最適化の言葉で整理します。

## 問題設定（最適化したいもの）

エンティティ $i$ の中心座標を $\mathbf{x}_i=(x_i,y_i)$、矩形サイズを $w_i,h_i$ とします。  
目的はざっくり次です。

1. 重なりを減らす
2. 関連の強いエンティティ同士を近づける
3. 全体を見やすく詰める
4. 10秒程度で終わる

典型的には次のような合成目的関数として解釈できます。

$$
\min_{\{\mathbf{x}_i\}} \;
\lambda_r F_{\text{relation}}
+ \lambda_s F_{\text{similarity}}
+ \lambda_c F_{\text{collision}}
+ \lambda_p F_{\text{packing}}
$$

- $\lambda_r, \lambda_s, \lambda_c, \lambda_p$: 各項の重み係数（どの目的をどれだけ重視するかを調整する）
- $F_{\text{relation}}$: リレーションで結ばれたエンティティ間の距離に関するコスト
- $F_{\text{similarity}}$: 名前が似たエンティティ間の距離に関するコスト
- $F_{\text{collision}}$: エンティティ同士の重なりに対するペナルティ
- $F_{\text{packing}}$: 全体の詰め込み具合（空白の無駄）に関するコスト

実装はこの式を直接最小化するのではなく、各項に対応する処理を段階的に適用して近似解を作ります。

## 実装パイプライン（2026-02-21時点）

`layoutWorker.ts` の実行フローは以下です。

1. 連結成分に分割（`SplitConnectedComponents`）
2. 各成分ごとに force-directed 最適化（`SimpleForceDirectedLayout`）
3. 成分を Shelf-packing で再配置（`packConnectedComponents`）

> **Force-directed（力指向）法**: グラフのノードに仮想的な物理力（ばねの引力、電荷の斥力など）を設定し、力の釣り合い（平衡状態）に達するまでシミュレーションすることで、見やすい配置を自動的に得る手法です。数理最適化としては、暗黙のエネルギー関数を物理シミュレーションで近似的に最小化していると解釈できます。
>
> **Shelf-packing（棚詰め法）**: 2次元の矩形詰め込み問題（bin packing）の近似アルゴリズムの一つです。棚（shelf）と呼ばれる横一列の帯状領域に矩形を左から順に詰め、帯が一杯になったら次の段に移る、というシンプルな方法です。

この構成は、数理最適化でいう「分割統治（decomposition）」です。  
1つの巨大問題を、連結成分ごとの小問題に分けて解くことで、計算量と収束性を改善しています。

## 使用ライブラリ

### Graphology

JavaScript / TypeScript 向けの汎用グラフオブジェクトライブラリ。有向・無向・混合グラフを統一インターフェースで扱え、連結成分分析や Louvain コミュニティ検出など包括的な標準ライブラリを提供します。Sigma.js のデータバックエンドとしても利用されています。npm 週間ダウンロード数は約80万件。MIT ライセンス。

> **Louvain コミュニティ検出**: グラフ内で密に結合されたノード群（コミュニティ）を自動的に発見するアルゴリズムです。「モジュラリティ」と呼ばれるコミュニティの良さの指標を貪欲法で最大化し、階層的にグラフを粗視化していくことで高速に動作します。

本プロジェクトでは、ER 図のリレーション構造をグラフとして表現し、連結成分分割やコミュニティ検出に使用しています。

### d3-force

D3.js エコシステムの力指向グラフレイアウトライブラリ。velocity Verlet 数値積分を用いてノード間の物理的な力をシミュレートし、`forceLink`（ばね制約）、`forceManyBody`（Barnes-Hut 近似による斥力）、`forceCollide`（衝突回避）などの力モデルを組み合わせてグラフを配置します。npm 週間ダウンロード数は約190万件。ISC ライセンス。

> **velocity Verlet 法**: 常微分方程式の数値積分法の一つで、物理シミュレーションで広く使われます。通常の Euler 法（$x_{n+1}=x_n+v_n\Delta t$）より精度が高く、位置と速度を半ステップずらして更新することでエネルギー保存性に優れます。
>
> **Barnes-Hut 近似**: $n$ 個のノード間の全対全斥力計算は本来 $O(n^2)$ ですが、空間を四分木（2D）や八分木（3D）で再帰的に分割し、遠くのノード群をまとめて1つの点として扱うことで $O(n\log n)$ に高速化する手法です。天体の重力多体問題のために考案されました。

本プロジェクトでは、各連結成分内のエンティティ配置の中核アルゴリズムとして使用しています。

### React Flow

ノードベースの UI エディタを構築するためのオープンソース React ライブラリ。ズーム・パン・ノード選択・キーボードショートカットなどの機能が組み込まれており、`useNodesInitialized` 等のカスタムフックで拡張可能です。GitHub スター数 31,000 以上、npm 週間ダウンロード数は約85万件。MIT ライセンス。

本プロジェクトでは、ER 図の描画・操作基盤として使用しており、レイアウト最適化の結果をノード位置に反映する際にも連携しています。

## 使っている最適化技術

### 1. グラフ分割（connected components）

`graphology` の `connectedComponents` を使い、グラフ $G=(V,E)$ を成分 $G_k$ に分割します。

- $G$: エンティティとリレーションで構成されるグラフ全体
- $V$: ノード（エンティティ）の集合
- $E$: エッジ（リレーション）の集合
- $G_k$: 分割後の $k$ 番目の連結成分（互いにリレーションで到達可能なエンティティ群）

これは重み付き最適化の前処理として定番で、計算量は実質 $O(|V|+|E|)$ です。

### 2. Force-directed 法（d3-force）

各成分内で d3-force のシミュレーションを回します。

- `forceLink`: ばね制約（「つながっているノードは適切距離を保つ」）
- `forceManyBody`: 斥力（ノード密集を防ぐ）
- `forceCollide`: 円近似衝突（重なりを減らす）

実装の主な式は以下です。

- 衝突半径（コード実装）
  $$
  r_i = 0.5\sqrt{w_i^2+h_i^2}+15
  $$
  - $r_i$: エンティティ $i$ の衝突半径（矩形の対角線長の半分に余白15pxを加えた値）
- リレーション辺の目標距離
  $$
  d_{ij}=r_i+r_j+30
  $$
  - $d_{ij}$: エンティティ $i$ と $j$ の間のリレーション辺の目標距離（両者の衝突半径の和に余白30pxを加えた値）
- many-body の強さ
  $$
  \text{strength} = -1.5 \cdot \overline{d}
  $$
  （$\overline{d}$: リレーション辺の平均距離）

ばねエネルギーとして見ると、`forceLink` は概ね
$$
F_{\text{relation}}=\sum_{(i,j)\in E_r}\left(\|\mathbf{x}_i-\mathbf{x}_j\|-d_{ij}\right)^2
$$

- $E_r$: リレーションで結ばれたエンティティペアの集合
- $\|\mathbf{x}_i-\mathbf{x}_j\|$: エンティティ $i$ と $j$ の中心間のユークリッド距離

を減らす方向に働くと解釈できます（d3-force自体は物理シミュレーションとして更新）。

`d3-force` の simulation は velocity Verlet 法ベース、`forceManyBody` は Barnes-Hut 近似を使います。  
そのため全対全斥力より実用的な速度になります。

### 3. 名前類似度の仮想エッジ（弱い制約）

実装は、テーブル名類似度で「仮想エッジ」を追加します。  
類似度は次です。

> **Jaccard 係数**: 2つの集合の類似度を測る指標で、$J(A,B)=|A\cap B|/|A\cup B|$ です。完全一致なら1、共通要素がなければ0になります。

- Token Jaccard（`_` 区切り）
  $$
  J_t(A,B)=\frac{|A\cap B|}{|A\cup B|}
  $$
  テーブル名を `_` で分割した単語（トークン）の集合で Jaccard 係数を計算します。
  例: `user_account` → `{user, account}`、`user_profile` → `{user, profile}` → $J_t = 1/3$

- Bigram Jaccard
  $$
  J_b(A,B)=\frac{|B_2(A)\cap B_2(B)|}{|B_2(A)\cup B_2(B)|}
  $$
  - $B_2(A)$: 文字列 $A$ から生成されるbigram（連続2文字）の集合

  文字列を連続2文字（bigram）に分解した集合で Jaccard 係数を計算します。トークン分割では捉えにくい部分的な文字列一致を検出できます。
  例: `user` → `{us, se, er}`
- 合成
  $$
  s=0.6J_t+0.4J_b
  $$
  - $s$: 2つのテーブル名間の合成類似度スコア（0〜1）

`threshold=0.35`, `k=3` で枝刈りし、密な完全グラフ化を防ぎます。
これは「ソフト制約付き最適化」の設計です。

> **top-k 枝刈り**: 各ノードについて類似度の高い上位 $k$ 個のエッジだけを残し、残りを捨てる手法です。全ペアにエッジを張ると $O(n^2)$ 本になりグラフが密になりすぎるため、計算量とレイアウト品質の両面で効果があります。
>
> **ソフト制約**: 満たすことが望ましいが、違反してもペナルティとして目的関数に加算されるだけの制約です。対義語の「ハード制約」は絶対に満たさなければならない制約を指します。ここでは、類似名テーブルを近くに置くことを「強制」ではなく「弱い引力」として表現しています。

注: 現状コードでは similarity-link の距離式に固定値 `similarity=0.5` を入れており、エッジごとの類似度は距離に直接反映していません（存在自体は反映）。

### 4. 成分パッキング（2D配置ヒューリスティック）

成分ごとに得られた bounding box を面積降順に並べ、Shelf-packing で左上から詰めます。
これは2次元パッキング問題の近似解法です。

> **bounding box（バウンディングボックス）**: あるオブジェクト群をすっぽり囲む最小の軸平行矩形のことです。ここでは、各連結成分内の全エンティティを囲む矩形を指します。
>
> **2次元パッキング問題**: 複数の矩形を、できるだけ隙間なく限られた領域に詰め込む組合せ最適化問題です。厳密解を求めることは NP 困難であるため、ここでは Shelf-packing というヒューリスティックで近似しています。

実装上は:

1. 各成分 bbox を計算
2. 面積降順ソート
3. 行幅 `shelfWidth=2000` を超えたら改行
4. マージン `50px` を確保してオフセット配置

### 5. Web Worker 化（最適化の実行戦略）

最適化は `layoutWorker.ts` で実行され、UIスレッドをブロックしません。
これはアルゴリズム自体ではなく実行戦略ですが、10秒制約で UX を守るための重要設計です。

> **Web Worker**: ブラウザが提供する仕組みで、メインスレッド（画面描画やユーザー操作を処理するスレッド）とは別のバックグラウンドスレッドで JavaScript を実行できます。重い計算をここに逃がすことで、計算中も画面がフリーズしなくなります。

## 数理最適化としての位置づけ

この機能は、ILP/SA/GA のような厳密・準厳密探索ではなく、以下のハイブリッドです。

> **ILP（Integer Linear Programming, 整数線形計画法）**: 決定変数を整数に制限した線形計画問題。厳密解が得られるが、問題サイズが大きいと計算時間が爆発的に増加します。
>
> **SA（Simulated Annealing, 焼きなまし法）**: 金属の焼きなましに着想を得たメタヒューリスティクスです。解の探索中に「温度」パラメータを徐々に下げながら、確率的に悪い解への遷移も許すことで局所最適に陥りにくくします。
>
> **GA（Genetic Algorithm, 遺伝的アルゴリズム）**: 生物の進化を模倣したメタヒューリスティクスです。複数の解候補（個体）を「選択・交叉・突然変異」で世代的に改善していきます。

- 連結成分分割（問題分解）
- 力学ベース連続最適化（force simulation）
- 離散ヒューリスティック（top-k 枝刈り、shelf packing）

ERレイアウトは「交差最小化」「矩形非重複」を同時に厳密に解くと計算が重くなりやすく、MVP要件（ブラウザで短時間）ではこの選択が合理的です。

> **交差最小化（crossing minimization）**: グラフ描画において、辺同士の交差（クロッシング）の数をできるだけ少なくする問題です。交差が少ないほど図が見やすくなりますが、最小交差数を求める問題は NP 困難であることが知られています。

## 仕様と実装の差分（重要）

`spec/entity_layout_optimization.md` と現状実装を比べると、主に次の差分があります。

1. ノード実寸の扱い
   - 仕様: React Flow 実測サイズ利用を想定
   - 実装: `commandLayoutOptimize` で幅200固定、高さはカラム数から推定
2. 名前類似度リンク距離
   - 仕様: 類似度スコアで距離を変化
   - 実装: 距離式で `similarity=0.5` 固定
3. 多段アルゴリズムの利用範囲
   - `LouvainClustering` / `CoarseLayout` / `FineLayout` / `RemoveOverlaps` は実装・テスト済みだが、Workerの本流では未使用

つまり、現在の中核は「成分分割 + force + packing」の3段です。

## 計算量の目安

300ノード規模を想定したときの支配項は概ね以下です。

- 類似度全ペア計算: $O(n^2)$（300で約45,000ペア）
- force反復: tick数に比例（実装上限400）
- 成分分割: $O(n+m)$（$n$: ノード数、$m$: エッジ数）
- packing: 成分数を $c$ として $O(c\log c)$ + ノード線形

したがって「全部を厳密最適化で解く」より、この分解ヒューリスティックの方が現実的です。

## 参考（仕様・実装・公式ドキュメント）

- 仕様: `spec/entity_layout_optimization.md`
- 実装: `public/src/utils/layoutOptimizer.ts`
- 実装: `public/src/workers/layoutWorker.ts`
- 実装: `public/src/commands/layoutOptimizeCommand.ts`
- d3-force simulation: https://d3js.org/d3-force/simulation
- d3-force link: https://d3js.org/d3-force/link
- d3-force many-body: https://d3js.org/d3-force/many-body
- d3-force collide: https://d3js.org/d3-force/collide
- Graphology connected components: https://graphology.github.io/standard-library/components.html
- Graphology Louvain: https://graphology.github.io/standard-library/communities-louvain.html
- Web Worker（MDN）: https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers
- React Flow `useNodesInitialized`: https://reactflow.dev/api-reference/hooks/use-nodes-initialized
