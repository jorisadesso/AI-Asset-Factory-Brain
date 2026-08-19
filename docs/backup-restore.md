# Backup & Restore

## What to back up

| What | Container path | Volume |
|------|---------------|--------|
| SQLite database | `/app/data/prod.db` | `db_data` |
| Uploaded files | `/app/storage/uploads/` | `uploads_data` |

## SQLite backup (online-safe)

```bash
# Safe online backup using sqlite3 .backup (does not require stopping the container)
docker exec <container_name> sqlite3 /app/data/prod.db ".backup /app/data/prod.db.bak"

# Copy backup to host
docker cp <container_name>:/app/data/prod.db.bak ./backups/prod-$(date +%Y%m%d-%H%M%S).db
```

Alternative using VACUUM INTO (SQLite 3.27+, produces a compact copy):

```bash
docker exec <container_name> sqlite3 /app/data/prod.db "VACUUM INTO '/app/data/prod.db.bak'"
docker cp <container_name>:/app/data/prod.db.bak ./backups/prod-$(date +%Y%m%d-%H%M%S).db
```

## Upload directory backup

```bash
docker cp <container_name>:/app/storage/uploads/ ./backups/uploads-$(date +%Y%m%d-%H%M%S)/
```

## Restore procedure

1. Stop the container: `docker stop <container_name>`
2. Copy the backup into the volume:
   ```bash
   docker run --rm -v db_data:/app/data -v $(pwd)/backups:/backups alpine \
     cp /backups/prod-YYYYMMDD-HHMMSS.db /app/data/prod.db
   ```
3. Restore uploads:
   ```bash
   docker run --rm -v uploads_data:/app/storage/uploads -v $(pwd)/backups:/backups alpine \
     cp -r /backups/uploads-YYYYMMDD-HHMMSS/. /app/storage/uploads/
   ```
4. Start the container: `docker start <container_name>`

## Suggested backup frequency

- **Database**: daily automated backup, retain 7 days
- **Uploads**: weekly, or after bulk document ingestion sessions
- **Before any deployment/update**: manual backup of both

## Notes

- The `.backup` command is safe under concurrent reads/writes; it does not lock the DB.
- Store backups outside the container host (e.g. object storage or NAS) for disaster recovery.
