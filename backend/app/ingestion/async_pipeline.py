import asyncio
from typing import List

class DocumentIngestionPipeline:
    """Asynchronous pipeline for processing large industrial documents."""
    
    def __init__(self):
        self.processing_queue = asyncio.Queue()
        self.workers_started = False

    async def _worker(self, worker_id: int):
        print(f"Ingestion Worker {worker_id} started.")
        while True:
            file_path = await self.processing_queue.get()
            try:
                print(f"Worker {worker_id} processing: {file_path}")
                await self._process_document(file_path)
            except Exception as e:
                print(f"Worker {worker_id} failed on {file_path}: {e}")
            finally:
                self.processing_queue.task_done()

    async def _process_document(self, file_path: str):
        # Simulated async processing steps
        await asyncio.sleep(1)  # Simulate OCR
        print(f"OCR completed for {file_path}")
        
        await asyncio.sleep(0.5)  # Simulate Chunking
        print(f"Semantic chunking completed for {file_path}")
        
        await asyncio.sleep(1.5)  # Simulate Embedding & Graph linkage
        print(f"Embedding and Graph linkage completed for {file_path}")
        print(f"Successfully ingested {file_path}")

    def start_workers(self, num_workers: int = 3):
        if not self.workers_started:
            for i in range(num_workers):
                asyncio.create_task(self._worker(i))
            self.workers_started = True

    async def queue_document(self, file_path: str):
        self.start_workers()
        await self.processing_queue.put(file_path)
        print(f"Document queued for processing: {file_path}")

# Example usage
async def main():
    pipeline = DocumentIngestionPipeline()
    await pipeline.queue_document("uploads/IOM_3196i-FRAME.pdf")
    await pipeline.queue_document("uploads/pdfcoffee.com_oisd-std-116-fire-protection-facilities-in-refinery-and-processing-plant-pdf-free.pdf")
    await pipeline.queue_document("uploads/CSBFinalReportBP.pdf")
    
    # Wait for all tasks to be processed
    await pipeline.processing_queue.join()
    print("All documents processed successfully into NEXUS IQ!")

if __name__ == "__main__":
    asyncio.run(main())
