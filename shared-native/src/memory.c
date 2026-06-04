#include "gradido_blockchain_core/memory.h"
#include "gradido_blockchain_core/result.h"

#include <malloc.h>
#include <string.h>

grd_result grd_memory_init_arena(grd_memory *memory, size_t capacity) {
  if (!memory) { return GRD_ERROR_NULL_POINTER; }
  if (!capacity) { return GRD_ERROR_INVALID_PARAM; }
  memory->data = (uint8_t *)malloc(capacity);
  if (!memory->data) { return GRD_ERROR_OUT_OF_MEMORY; }
  memory->last_index = 0;
  memory->capacity = capacity;
  memory->out_of_memory_capacity = 0;
  memory->allocation_type = GRD_MEMORY_ALLOC_TYPE_ARENA_OWNED;
  return GRD_SUCCESS;
}

grd_result grd_memory_init_arena_static(grd_memory *memory, uint8_t *data, size_t capacity) {
  if (!memory || !data) { return GRD_ERROR_NULL_POINTER; }
  if (!capacity) { return GRD_ERROR_INVALID_PARAM; }
  memory->data = data;
  memory->last_index = 0;
  memory->capacity = capacity;
  memory->out_of_memory_capacity = 0;
  memory->allocation_type = GRD_MEMORY_ALLOC_TYPE_ARENA_EXTERNAL;
  return GRD_SUCCESS;
}

grd_result grd_memory_init_default(grd_memory *memory) {
  if (!memory) { return GRD_ERROR_NULL_POINTER; }
  memory->data = NULL;
  memory->last_index = 0;
  memory->capacity = 0;
  memory->out_of_memory_capacity = 0;
  memory->allocation_type = GRD_MEMORY_ALLOC_TYPE_DEFAULT;
  return GRD_SUCCESS;
}

grd_result grd_memory_reset(grd_memory *memory) {
  if (!memory) { return GRD_ERROR_NULL_POINTER; }
  if (GRD_MEMORY_ALLOC_TYPE_ARENA_OWNED == memory->allocation_type ||
      GRD_MEMORY_ALLOC_TYPE_ARENA_EXTERNAL == memory->allocation_type) {
    memory->last_index = 0;
    memory->out_of_memory_capacity = 0;
  }
  return GRD_SUCCESS;
}

void grd_memory_free(grd_memory *memory) {
  if (!memory) return;
  if (memory->data && GRD_MEMORY_ALLOC_TYPE_ARENA_OWNED == memory->allocation_type) {
    free(memory->data);
    memory->data = NULL;
  }
  memory->last_index = 0;
  memory->capacity = 0;
  memory->out_of_memory_capacity = 0;
}

size_t grd_memory_overflow_total(const grd_memory *memory) {
  if (!memory) { return 0; }
  return memory->out_of_memory_capacity;
}

grd_result grd_memory_buffer_alloc(uint8_t **buffer, grd_memory *memory, size_t size) {
  if (!buffer || !memory) { return GRD_ERROR_NULL_POINTER; }
  if (!size) { return GRD_ERROR_INVALID_PARAM; }

  if (GRD_MEMORY_ALLOC_TYPE_DEFAULT == memory->allocation_type) {
    *buffer = (uint8_t *)malloc(size);
    if (!*buffer) { return GRD_ERROR_OUT_OF_MEMORY; }
    return GRD_SUCCESS;
  }
  if (!memory->data) { return GRD_ERROR_NOT_INITIALIZED; }
  // align with 8 Bytes
  uintptr_t current_addr = (uintptr_t)(memory->data + memory->last_index);
  uintptr_t aligned_addr = ALIGN8(current_addr);
  size_t alignment_padding = (size_t)(aligned_addr - current_addr);

  if (memory->last_index + alignment_padding + size > memory->capacity) {
    memory->out_of_memory_capacity += size;
    return GRD_ERROR_OUT_OF_MEMORY;
  }
  // set last_index to next aligned place
  memory->last_index += alignment_padding;

  *buffer = memory->data + memory->last_index;
  memory->last_index += size;
  return GRD_SUCCESS;
}

grd_result grd_memory_buffer_copy(
    uint8_t **dst_buffer, const uint8_t *src, grd_memory *memory, size_t size
) {
  if (!dst_buffer || !src || !memory) { return GRD_ERROR_NULL_POINTER; }
  if (!size) { return GRD_ERROR_INVALID_PARAM; }
  grd_result result = grd_memory_buffer_alloc(dst_buffer, memory, size);
  if (GRD_SUCCESS != result) { return result; }

  memcpy(*dst_buffer, src, size);
  return GRD_SUCCESS;
}

grd_result grd_memory_block_alloc(grd_memory_block *memory_block, grd_memory *memory, size_t size) {
  if (!memory_block || !memory) { return GRD_ERROR_NULL_POINTER; }
  grd_result result = grd_memory_buffer_alloc(&memory_block->data, memory, size);
  if (GRD_SUCCESS == result) { memory_block->size = size; }
  return result;
}

grd_result grd_memory_block_copy(
    grd_memory_block *dst, const grd_memory_block *src, grd_memory *memory
) {
  if (!dst || !src || !memory) { return GRD_ERROR_NULL_POINTER; }
  if (!src->size) { return GRD_ERROR_INVALID_PARAM; }
  grd_result result = grd_memory_block_alloc(dst, memory, src->size);
  if (GRD_SUCCESS != result) { return result; }

  memcpy(dst->data, src->data, src->size);
  return GRD_SUCCESS;
}

grd_result grd_memory_buffer_free(uint8_t *buffer, grd_memory *memory) {
  if (!buffer || !memory) { return GRD_ERROR_NULL_POINTER; }
  if (GRD_MEMORY_ALLOC_TYPE_DEFAULT == memory->allocation_type) { free(buffer); }
  return GRD_SUCCESS;
}

grd_result grd_memory_block_free(grd_memory_block *memory_block, grd_memory *memory) {
  if (!memory_block || !memory) { return GRD_ERROR_NULL_POINTER; }

  // if we are a arena allocator and free was called on the last allocated block, we can easy reuse
  // the memory space
  if (GRD_MEMORY_ALLOC_TYPE_ARENA_EXTERNAL == memory->allocation_type ||
      GRD_MEMORY_ALLOC_TYPE_ARENA_OWNED == memory->allocation_type) {
    if (memory->data + memory->last_index - memory_block->size == memory_block->data) {
      memory->last_index -= memory_block->size;
    }
  } else {
    grd_memory_buffer_free(memory_block->data, memory);
  }

  memory_block->data = NULL;
  memory_block->size = 0;
  return GRD_SUCCESS;
}

grd_result grd_memory_block_free_part(
    grd_memory_block *memory_block, grd_memory *memory, size_t size_to_release
) {
  if (!memory_block || !memory) { return GRD_ERROR_NULL_POINTER; }
  if (memory_block->size < size_to_release) { return GRD_ERROR_INVALID_PARAM; }
  if (memory_block->size == size_to_release) { return grd_memory_block_free(memory_block, memory); }
  if (GRD_MEMORY_ALLOC_TYPE_ARENA_EXTERNAL == memory->allocation_type ||
      GRD_MEMORY_ALLOC_TYPE_ARENA_OWNED == memory->allocation_type) {
    if (memory->data + memory->last_index - memory_block->size == memory_block->data) {
      memory->last_index -= size_to_release;
      memory_block->size -= size_to_release;
    }
  }
  return GRD_SUCCESS;
}
