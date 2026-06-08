#ifndef GRADIDO_BLOCKCHAIN_CORE_MEMORY_H
#define GRADIDO_BLOCKCHAIN_CORE_MEMORY_H

#include <stddef.h>
#include <stdint.h>

#include "result.h"

#ifdef __cplusplus
extern "C" {
#endif

/** @defgroup grd_memory grd_memory
 *  @ingroup utils
 *  @brief Memory allocator supporting arena and default malloc modes.
 *
 *  A flexible allocation system offering three operational modes:
 *  - Arena with owned heap buffer: pre-allocated block via malloc, linear bump allocation
 *  - Arena with external buffer: wraps caller-provided memory, no allocation overhead
 *  - Default malloc/free: fallback to standard heap for individual allocations
 *
 *  Arena modes provide fast, deterministic allocation with O(1) bump pointer
 *  semantics. Once arena capacity is exhausted, allocation fails with
 *  GRD_ERROR_OUT_OF_MEMORY. The overflow accumulator tracks total failed
 *  requests for capacity tuning. Individual deallocation is not supported in
 *  arena modes; free the entire arena or reset for reuse.
 *
 *  Modelled after Zig's ArenaAllocator, adapted for multi-mode operation.
 *
 *  @{
 */

/* Alignment: Most CPUs access memory more efficiently if data starts at
 * addresses that are multiples of 4 or 8. We'll align to 8 bytes.
 * This macro takes a size 'x' and rounds it UP to the nearest multiple of 8.
 * Example: ALIGN8(3) -> 8, ALIGN8(8) -> 8, ALIGN8(10) -> 16
 */
#define ALIGN8(x) (((x) + 7) & (~7))

/** @brief Operational mode for memory allocator.
 *
 *  Determines allocation strategy and ownership semantics.
 */
typedef enum grd_memory_alloc_type {
  GRD_MEMORY_ALLOC_TYPE_DEFAULT = 0, /**< Individual malloc/free per allocation. */
  GRD_MEMORY_ALLOC_TYPE_ARENA_OWNED =
      1, /**< Bump allocator with heap-allocated buffer owned by the allocator. */
  GRD_MEMORY_ALLOC_TYPE_ARENA_EXTERNAL =
      2 /**< Bump allocator with caller-provided external buffer. */
} grd_memory_alloc_type;

/** @brief Memory allocator state container.
 *
 *  Tracks allocation state across three operational modes. In arena modes,
 *  maintains a bump pointer within a contiguous region. In default mode,
 *  capacity remains zero and each allocation is independent.
 *
 *  @note All sizes are in bytes. @p out_of_memory_capacity accumulates
 *  total requested size beyond capacity in arena modes, useful for tuning.
 */
typedef struct grd_memory {
  uint8_t *data;                 /**< Base of the arena (owned or external). */
  size_t last_index;             /**< Next free offset from @p data. */
  size_t capacity;               /**< Total bytes available in the arena. */
  size_t out_of_memory_capacity; /**< Accumulated overflow since last reset. */
  grd_memory_alloc_type allocation_type;
} grd_memory;

typedef struct grd_memory_block {
  uint8_t *data;
  size_t size;
} grd_memory_block;

/** @brief Initialize arena mode with owned heap buffer.
 *
 *  Allocates @p capacity bytes via malloc and binds the arena to this buffer.
 *  The allocator owns the buffer and will free it on grd_memory_free().
 *  All state fields (last_index, out_of_memory_capacity) reset to zero.
 *
 *  @param[in,out] memory   Allocator to initialize; must not be NULL.
 *  @param[in]     capacity Bytes to allocate; must be > 0.
 *  @return grd_result indicating success or failure type.
 *  @retval GRD_SUCCESS              Arena initialized and ready.
 *  @retval GRD_ERROR_NULL_POINTER   @p memory is NULL.
 *  @retval GRD_ERROR_INVALID_PARAM  @p capacity is 0.
 *  @retval GRD_ERROR_OUT_OF_MEMORY  malloc failed; buffer not allocated.
 *  @note The allocator owns the heap buffer; use grd_memory_free() to release.
 *  @whisper Fresh soil prepared; seeds may now take root
 */
grd_result grd_memory_init_arena(grd_memory *memory, size_t capacity);

/** @brief Initialize arena mode with external buffer.
 *
 *  Binds the allocator to a caller-provided buffer without copying or
 *  allocation. The caller retains ownership of @p data; the allocator
 *  merely tracks position within it. Suitable for stack buffers, static
 *  storage, or memory-mapped regions.
 *
 *  @param[in,out] memory   Allocator to initialize; must not be NULL.
 *  @param[in]     data     External buffer to use as backing store; must not be NULL.
 *  @param[in]     capacity Size of @p data in bytes; must be > 0.
 *  @return grd_result indicating success or failure type.
 *  @retval GRD_SUCCESS             Arena bound to external buffer.
 *  @retval GRD_ERROR_NULL_POINTER  @p memory or @p data is NULL.
 *  @retval GRD_ERROR_INVALID_PARAM @p capacity is 0.
 *  @note The allocator must not outlive the external buffer it wraps.
 *  @whisper A river channel carved through known earth
 */
grd_result grd_memory_init_arena_static(grd_memory *memory, uint8_t *data, size_t capacity);

/** @brief Initialize default mode using malloc/free.
 *
 *  Configures the allocator as a thin wrapper around standard malloc/free.
 *  Each allocation request calls malloc individually; each free releases
 *  the specific block. No pre-allocation occurs; capacity remains zero.
 *
 *  @param[in,out] memory   Allocator to initialize; must not be NULL.
 *  @return grd_result indicating success or failure type.
 *  @retval GRD_SUCCESS             Allocator configured for default malloc mode.
 *  @retval GRD_ERROR_NULL_POINTER  @p memory is NULL.
 *  @whisper Open water; each drop finds its own level
 */
grd_result grd_memory_init_default(grd_memory *memory);

/** @brief Reset arena position to initial state.
 *
 *  In arena modes (owned or external), resets the bump pointer to zero
 *  and clears the overflow accumulator. Previously allocated blocks become
 *  invalid; do not access them after reset. In default mode, this is a
 *  no-op as allocations are managed individually.
 *
 *  @param[in,out] memory   Allocator to reset; must not be NULL.
 *  @return grd_result indicating success or failure type.
 *  @retval GRD_SUCCESS             Arena position reset to zero.
 *  @retval GRD_ERROR_NULL_POINTER  @p memory is NULL.
 *  @note In arena modes, all prior allocations become invalid after reset.
 *  @whisper Waters recede; the basin returns to silence
 */
grd_result grd_memory_reset(grd_memory *memory);

/** @brief Release allocator resources.
 *
 *  In arena-owned mode, frees the internally allocated buffer. In arena-external
 *  mode, merely drops the reference without affecting the caller's buffer.
 *  In default mode, no action is needed as individual blocks are freed
 *  separately via grd_memory_buffer_free(). Safe to call on NULL.
 *
 *  @param[in,out] memory   Allocator to release; may be NULL.
 *  @post All internal state is zeroed; no dangling pointers remain in owned mode.
 *  @whisper Waters recede; the basin returns to silence
 */
void grd_memory_free(grd_memory *memory);

/** @brief Retrieve total accumulated overflow in arena modes.
 *
 *  Returns the sum of all allocation requests that exceeded arena capacity
 *  since initialization or last reset. Useful for capacity planning and
 *  tuning initial arena sizes. In default mode, always returns 0.
 *
 *  @param[in] memory   Allocator to query; may be NULL.
 *  @return Total bytes of failed requests, or 0 if @p memory is NULL
 *          or allocator is in default mode.
 *  @note The counter resets to zero on grd_memory_reset() or re-initialization.
 *  @whisper The measure of need that exceeded the vessel
 */
size_t grd_memory_overflow_total(const grd_memory *memory);

/** @brief Allocate raw memory buffer.
 *
 *  Core allocation primitive used by grd_memory_buffer_alloc().
 *  In arena modes, performs bump-pointer allocation from the arena.
 *  In default mode, calls malloc individually.
 *
 *  @param[out]    buffer  Pointer to receive allocated memory; must not be NULL.
 *  @param[in,out] memory  Allocator to use; must not be NULL.
 *  @param[in]     size    Bytes to allocate; must be > 0.
 *  @return grd_result indicating success or failure type.
 *  @retval GRD_SUCCESS              Buffer allocated successfully.
 *  @retval GRD_ERROR_NULL_POINTER  @p buffer or @p memory is NULL.
 *  @retval GRD_ERROR_INVALID_PARAM @p size is 0.
 *  @retval GRD_ERROR_NOT_INITIALIZED Arena buffer not initialized.
 *  @retval GRD_ERROR_OUT_OF_MEMORY  Arena exhausted or malloc failed.
 *  @note In arena modes, the returned pointer is valid until reset or free.
 *  @whisper Raw earth shaped by the hand of need
 */
grd_result grd_memory_buffer_alloc(uint8_t **buffer, grd_memory *memory, size_t size);

grd_result grd_memory_buffer_copy(
    uint8_t **dst_buffer, const uint8_t *src, grd_memory *memory, size_t size
);

/** @brief Free raw memory buffer.
 *
 *  Core deallocation primitive used by grd_memory_block_free().
 *  In default mode, calls free() on the buffer. In arena modes,
 *  performs no action as arena memory is freed collectively.
 *
 *  @param[in]     buffer  Buffer to free; must not be NULL.
 *  @param[in]     memory  Allocator used for allocation; must not be NULL.
 *  @return grd_result indicating success or failure type.
 *  @retval GRD_SUCCESS             Buffer freed or no-op completed.
 *  @retval GRD_ERROR_NULL_POINTER @p buffer or @p memory is NULL.
 *  @note In arena modes, this does not reclaim space; reset the arena instead.
 *  @whisper Form dissolves, substance returning to source
 */
grd_result grd_memory_buffer_free(uint8_t *buffer, grd_memory *memory);

/** @brief Allocate a memory block with size tracking.
 *
 *  Wrapper around grdu_memory_alloc() that stores size in a block descriptor.
 *  In arena modes, performs bump-pointer allocation; in default mode,
 *  calls malloc individually.
 *
 *  @p memory_block is overwritten regardless of prior contents. Caller must
 *  ensure any previous block data is freed (in default mode) or no longer
 *  needed (arena modes) before calling again.
 *
 *  @param[out]    memory_block Block descriptor to fill; must not be NULL.
 *  @param[in,out] memory       Allocator to use; must not be NULL.
 *  @param[in]     size         Bytes to allocate; must be > 0.
 *  @return grd_result indicating success or failure type.
 *  @retval GRD_SUCCESS              Block allocated successfully.
 *  @retval GRD_ERROR_NULL_POINTER   @p memory_block or @p memory is NULL.
 *  @retval GRD_ERROR_INVALID_PARAM  @p size is 0.
 *  @retval GRD_ERROR_NOT_INITIALIZED Allocator not initialized (arena modes without buffer).
 *  @retval GRD_ERROR_OUT_OF_MEMORY  Arena exhausted or malloc failed.
 *  @note In arena modes, individual blocks cannot be freed separately.
 *  @whisper A vessel carved from the flowing stream
 */
grd_result grd_memory_block_alloc(grd_memory_block *memory_block, grd_memory *memory, size_t size);

grd_result grd_memory_block_copy(
    grd_memory_block *dst, const grd_memory_block *src, grd_memory *memory
);

/** @brief Free a memory block with size tracking.
 *
 *  Wrapper around grdu_memory_free_buffer() that also nullifies the
 *  block descriptor. In default mode, frees the underlying buffer.
 *  In arena modes, only clears the descriptor without freeing memory,
 *  as arena deallocation occurs via grd_memory_reset() or
 *  grd_memory_free().
 *
 *  @param[in,out] memory_block Block to release; must not be NULL.
 *  @param[in]     memory       Allocator used for allocation; must not be NULL.
 *  @return grd_result indicating success or failure type.
 *  @retval GRD_SUCCESS             Block descriptor cleared.
 *  @retval GRD_ERROR_NULL_POINTER @p memory_block or @p memory is NULL.
 *  @note In arena modes, this does not reclaim space; reset the arena instead.
 *  @whisper The vessel returns to water, form dissolving
 */
grd_result grd_memory_block_free(grd_memory_block *memory_block, grd_memory *memory);

/*
 * if memory_block was the last allocated block, we can release what we don't need at the end
 * work only with area memory, will do nothing on other memory types
 * will call grd_memory_block_free if size_to_release == memory_block->size
 */
grd_result grd_memory_block_free_part(
    grd_memory_block *memory_block, grd_memory *memory, size_t size_to_release
);

/** @} */

#ifdef __cplusplus
}
#endif

#endif // GRADIDO_BLOCKCHAIN_CORE_MEMORY_H
