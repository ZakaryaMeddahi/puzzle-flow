-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seed_counters" (
    "difficulty" TEXT NOT NULL,
    "next_seed" BIGINT NOT NULL DEFAULT 1,

    CONSTRAINT "seed_counters_pkey" PRIMARY KEY ("difficulty")
);

-- CreateTable
CREATE TABLE "puzzle_registry" (
    "id" TEXT NOT NULL,
    "seed" BIGINT NOT NULL,
    "hash" CHAR(64) NOT NULL,
    "difficulty" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'available',
    "user_id" TEXT,
    "book_id" TEXT,
    "reserved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "puzzle_registry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "books" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT,
    "trim_size" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "page_count" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "pdf_path" TEXT,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "books_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "puzzle_registry_seed_key" ON "puzzle_registry"("seed");

-- CreateIndex
CREATE UNIQUE INDEX "puzzle_registry_hash_key" ON "puzzle_registry"("hash");

-- AddForeignKey
ALTER TABLE "puzzle_registry" ADD CONSTRAINT "puzzle_registry_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "puzzle_registry" ADD CONSTRAINT "puzzle_registry_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "books"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "books" ADD CONSTRAINT "books_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
