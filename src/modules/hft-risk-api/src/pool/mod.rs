//! Memory Pool - Zero-copy object pooling for request/response objects
//!
//! Implements lock-free memory pools for high-frequency trading workloads
//! with minimal allocation overhead.

use std::cell::UnsafeCell;
use std::mem::MaybeUninit;
use std::sync::atomic::{AtomicUsize, Ordering};

/// Lock-free object pool for fixed-size objects
/// 
/// Uses a Treiber stack implementation for lock-free push/pop operations
pub struct ObjectPool<T> {
    /// Storage for pooled objects
    storage: Vec<UnsafeCell<MaybeUninit<T>>>,
    /// Stack head index (atomic)
    head: AtomicUsize,
    /// Next pointer for each slot (atomic indices)
    next: Vec<AtomicUsize>,
    /// Capacity of the pool
    capacity: usize,
}

unsafe impl<T: Send> Send for ObjectPool<T> {}
unsafe impl<T: Send> Sync for ObjectPool<T> {}

const EMPTY: usize = usize::MAX;

impl<T> ObjectPool<T> {
    /// Create a new object pool with the specified capacity
    pub fn new(capacity: usize) -> Self {
        let mut storage = Vec::with_capacity(capacity);
        let mut next = Vec::with_capacity(capacity);

        for i in 0..capacity {
            storage.push(UnsafeCell::new(MaybeUninit::uninit()));
            next.push(AtomicUsize::new(if i + 1 < capacity { i + 1 } else { EMPTY }));
        }

        Self {
            storage,
            next,
            head: AtomicUsize::new(if capacity > 0 { 0 } else { EMPTY }),
            capacity,
        }
    }

    /// Try to acquire an object from the pool
    /// 
    /// Returns None if the pool is empty
    pub fn acquire<'a>(&'a self) -> Option<PoolGuard<'a, T>> {
        loop {
            let head = self.head.load(Ordering::Relaxed);
            
            if head == EMPTY {
                return None;
            }

            let next = self.next[head].load(Ordering::Relaxed);

            // Try to update head with CAS
            match self.head.compare_exchange_weak(
                head,
                next,
                Ordering::Release,
                Ordering::Relaxed,
            ) {
                Ok(_) => {
                    return Some(PoolGuard {
                        pool: self,
                        index: head,
                        initialized: false,
                    });
                }
                Err(_) => continue, // Retry on contention
            }
        }
    }

    /// Return an object to the pool
    /// 
    /// # Safety
    /// The index must be valid and the object must have been acquired from this pool
    unsafe fn release(&self, index: usize, _value: T) {
        // Drop the value
        std::ptr::drop_in_place((*self.storage[index].get()).as_mut_ptr());

        loop {
            let head = self.head.load(Ordering::Relaxed);
            self.next[index].store(head, Ordering::Relaxed);

            match self.head.compare_exchange_weak(
                head,
                index,
                Ordering::Release,
                Ordering::Relaxed,
            ) {
                Ok(_) => break,
                Err(_) => continue,
            }
        }
    }

    /// Get mutable reference to storage at index
    /// 
    /// # Safety
    /// The index must be valid and the caller must have exclusive access
    unsafe fn get_mut(&self, index: usize) -> &mut MaybeUninit<T> {
        &mut *self.storage[index].get()
    }

    /// Get the number of available objects in the pool
    pub fn available(&self) -> usize {
        let mut count = 0;
        let mut current = self.head.load(Ordering::Relaxed);
        
        while current != EMPTY && count < self.capacity {
            count += 1;
            current = self.next[current].load(Ordering::Relaxed);
        }
        
        count
    }

    /// Get pool capacity
    pub fn capacity(&self) -> usize {
        self.capacity
    }
}

/// Guard for a pooled object that returns it to the pool when dropped
pub struct PoolGuard<'a, T> {
    pool: &'a ObjectPool<T>,
    index: usize,
    initialized: bool,
}

impl<'a, T> PoolGuard<'a, T> {
    /// Initialize the pooled object with a value
    pub fn initialize(&mut self, value: T) -> &mut T {
        unsafe {
            (*self.pool.storage[self.index].get()).write(value);
        }
        self.initialized = true;
        unsafe { &mut *(*self.pool.storage[self.index].get()).as_mut_ptr() }
    }

    /// Get a reference to the object
    /// 
    /// # Panics
    /// Panics if the guard hasn't been initialized
    pub fn get(&self) -> &T {
        assert!(self.initialized, "PoolGuard not initialized");
        unsafe { &*(*self.pool.storage[self.index].get()).as_ptr() }
    }

    /// Get a mutable reference to the object
    /// 
    /// # Panics
    /// Panics if the guard hasn't been initialized
    pub fn get_mut(&mut self) -> &mut T {
        assert!(self.initialized, "PoolGuard not initialized");
        unsafe { &mut *(*self.pool.storage[self.index].get()).as_mut_ptr() }
    }
}

impl<'a, T> Drop for PoolGuard<'a, T> {
    fn drop(&mut self) {
        if self.initialized {
            unsafe {
                // Read the value and drop it
                let value = std::ptr::read((*self.pool.storage[self.index].get()).as_ptr());
                self.pool.release(self.index, value);
            }
        } else {
            // Just return the slot to the pool without dropping
            loop {
                let head = self.pool.head.load(Ordering::Relaxed);
                self.pool.next[self.index].store(head, Ordering::Relaxed);

                match self.pool.head.compare_exchange_weak(
                    head,
                    self.index,
                    Ordering::Release,
                    Ordering::Relaxed,
                ) {
                    Ok(_) => break,
                    Err(_) => continue,
                }
            }
        }
    }
}

/// Request/Response buffer pool for zero-copy operations
pub struct BufferPool {
    /// Small buffers (1KB)
    small: ObjectPool<Vec<u8>>,
    /// Medium buffers (16KB)
    medium: ObjectPool<Vec<u8>>,
    /// Large buffers (256KB)
    large: ObjectPool<Vec<u8>>,
}

impl BufferPool {
    /// Create a new buffer pool with specified capacities
    pub fn new(small_count: usize, medium_count: usize, large_count: usize) -> Self {
        let small = ObjectPool::new(small_count);
        let medium = ObjectPool::new(medium_count);
        let large = ObjectPool::new(large_count);

        // Pre-allocate buffers
        for _ in 0..small_count {
            if let Some(mut guard) = small.acquire() {
                guard.initialize(vec![0u8; 1024]);
            }
        }

        for _ in 0..medium_count {
            if let Some(mut guard) = medium.acquire() {
                guard.initialize(vec![0u8; 16 * 1024]);
            }
        }

        for _ in 0..large_count {
            if let Some(mut guard) = large.acquire() {
                guard.initialize(vec![0u8; 256 * 1024]);
            }
        }

        Self { small, medium, large }
    }

    /// Acquire a buffer of appropriate size
    pub fn acquire_buffer(&self, size: usize) -> Option<PoolGuard<Vec<u8>>> {
        if size <= 1024 {
            self.small.acquire()
        } else if size <= 16 * 1024 {
            self.medium.acquire()
        } else if size <= 256 * 1024 {
            self.large.acquire()
        } else {
            None
        }
    }

    /// Get pool statistics
    pub fn stats(&self) -> BufferPoolStats {
        BufferPoolStats {
            small_available: self.small.available(),
            small_capacity: self.small.capacity(),
            medium_available: self.medium.available(),
            medium_capacity: self.medium.capacity(),
            large_available: self.large.available(),
            large_capacity: self.large.capacity(),
        }
    }
}

/// Statistics for buffer pool
#[derive(Debug, Clone, Copy)]
pub struct BufferPoolStats {
    pub small_available: usize,
    pub small_capacity: usize,
    pub medium_available: usize,
    pub medium_capacity: usize,
    pub large_available: usize,
    pub large_capacity: usize,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_object_pool_basic() {
        let pool = ObjectPool::<i32>::new(10);
        
        // Acquire and initialize
        let mut guard = pool.acquire().unwrap();
        let value = guard.initialize(42);
        assert_eq!(*value, 42);
        
        // Drop guard, object should return to pool
        drop(guard);
        
        // Acquire again
        let guard2 = pool.acquire().unwrap();
        assert!(pool.available() <= 9);
    }

    #[test]
    fn test_object_pool_exhaustion() {
        let pool = ObjectPool::<i32>::new(3);
        
        let g1 = pool.acquire();
        let g2 = pool.acquire();
        let g3 = pool.acquire();
        let g4 = pool.acquire(); // Should be None
        
        assert!(g1.is_some());
        assert!(g2.is_some());
        assert!(g3.is_some());
        assert!(g4.is_none());
    }
}
