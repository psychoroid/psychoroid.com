package storage

import (
	"context"
	"time"

	"github.com/go-redis/redis/v8"
)

type RedisStorage struct {
    client *redis.Client
}

func NewRedisStorage(cfg *CacheConfig) (*RedisStorage, error) {
    client := redis.NewClient(&redis.Options{
        Addr:     cfg.Address,
        Password: cfg.Password,
        DB:       cfg.DB,
    })
    
    // Test connection
    if err := client.Ping(context.Background()).Err(); err != nil {
        return nil, err
    }
    
    return &RedisStorage{client: client}, nil
}

func (r *RedisStorage) Store(ctx context.Context, key string, data []byte, expiration time.Duration) error {
    return r.client.Set(ctx, key, data, expiration).Err()
}

func (r *RedisStorage) Get(ctx context.Context, key string) ([]byte, error) {
    return r.client.Get(ctx, key).Bytes()
}

func (r *RedisStorage) Delete(ctx context.Context, key string) error {
    return r.client.Del(ctx, key).Err()
} 