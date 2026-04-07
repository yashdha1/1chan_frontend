import Image from "next/image";

export default function AuthSplitLayout({ children }) {
	return (
		<div className="font-sans min-h-screen flex flex-col md:flex-row bg-zinc-950 text-zinc-100">
			<div className="relative w-full md:w-1/2 min-h-[38vh] md:min-h-screen shrink-0">
				<Image
					src="/auth-hero.svg"
					alt=""
					fill
					priority
					className="object-cover"
					sizes="(max-width: 768px) 100vw, 50vw"
				/>
				<div
					className="pointer-events-none absolute inset-0 md:hidden"
					style={{
						background:
							"linear-gradient(to bottom, transparent 0%, rgba(9,9,11,0.65) 100%)",
					}}
				/>
			</div>

			<div className="flex w-full md:w-1/2 min-h-[62vh] md:min-h-0 flex-1 items-center justify-center px-6 py-10 md:py-16">
				<div className="w-full max-w-[22rem]">{children}</div>
			</div>
		</div>
	);
}
